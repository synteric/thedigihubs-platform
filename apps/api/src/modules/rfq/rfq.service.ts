import { randomBytes, randomUUID } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationType, Prisma, QuoteStatus, RfqMessageVisibility, RfqStatus, RoleKey, SupplierVerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MatchingService } from '../matching/matching.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import type { TenantContext } from '../auth/auth.types';

type RfqAccessContext = {
  buyerOrganizationId: string;
  status: RfqStatus;
  matches: Array<{
    supplierProfileId: string;
    supplierProfile: {
      organizationId: string;
    };
  }>;
  quotes: Array<{
    supplierProfileId: string | null;
    supplierProfile?: {
      organizationId: string;
    } | null;
  }>;
  invites: Array<{
    supplierProfileId: string | null;
    supplierProfile?: {
      organizationId: string;
    } | null;
  }>;
};

type SupplierQuoteInput = {
  totalAmount: number;
  currency: string;
  deliveryDays: number;
  validityDays: number;
  warranty?: string;
  commercialNotes?: string;
  technicalResponse?: Record<string, unknown>;
  supportingDocuments?: Array<Record<string, unknown>>;
  status?: 'DRAFT' | 'SUBMITTED';
};

type QuoteDecisionInput = {
  status: 'SHORTLISTED' | 'REJECTED';
  note?: string;
};

type AwardQuoteInput = {
  quoteId: string;
  decisionNote?: string;
};

type RfqMessageInput = {
  body: string;
  subject?: string;
  supplierProfileId?: string;
  quoteId?: string;
};

type EvaluationSupplierProfile = {
  verificationStatus: string;
  rating: number;
  completedContracts: number;
  responseRate: number;
  countriesServed: string[];
  categories: string[];
} | null;

@Injectable()
export class RfqService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly matching: MatchingService,
  ) {}

  async create(dto: CreateRfqDto, tenant?: TenantContext) {
    const buyerContext = await this.resolveBuyerContext(dto, tenant);
    const year = new Date().getFullYear();
    const count = await this.prisma.rfq.count();
    const reference = `TDH-RFQ-${year}-${String(count + 1).padStart(4, '0')}`;
    const closingDate = new Date(dto.closingDate);
    const supportingDocuments: Prisma.InputJsonArray = (dto.supportingDocuments || []).map((document) => ({
      name: document.name,
      size: document.size,
      type: document.type || 'application/octet-stream',
      category: document.category || 'RFQ Document',
      ...(document.storageKey ? { storageKey: document.storageKey } : {}),
      ...(document.url ? { url: document.url } : {}),
    }));

    const rfq = await this.prisma.rfq.create({
      data: {
        reference,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        country: dto.country,
        deliveryLocation: dto.deliveryLocation,
        currency: dto.currency || 'USD',
        estimatedBudget: dto.estimatedBudget,
        closingDate,
        buyerOrganizationId: buyerContext.buyerOrganizationId,
        createdById: buyerContext.createdById,
        status: RfqStatus.DRAFT,
        technicalNotes: dto.technicalNotes,
        supportingDocuments,
        lineItems: {
          create: dto.lineItems.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
          })),
        },
        invites: {
          create: [
            ...(dto.selectedSupplierProfileIds || []).map((supplierProfileId) => ({
              supplierProfileId,
              token: randomUUID(),
              expiresAt: closingDate,
            })),
            ...(dto.externalInvites || []).map((invite) => ({
              externalEmail: invite.email,
              externalCompanyName: invite.companyName,
              token: randomUUID(),
              expiresAt: closingDate,
            })),
          ],
        },
      },
      include: { lineItems: true, invites: true },
    });

    await this.audit.record({
      actorId: buyerContext.createdById,
      rfqId: rfq.id,
      action: 'RFQ_CREATED',
      entity: 'Rfq',
      entityId: rfq.id,
      metadata: {
        reference: rfq.reference,
        supportingDocuments: dto.supportingDocuments?.length || 0,
        externalInvites: dto.externalInvites?.length || 0,
        selectedSuppliers: dto.selectedSupplierProfileIds?.length || 0,
      },
    });

    if (!dto.autoMatch) {
      return rfq;
    }

    const matching = await this.matching.matchSuppliersForRfq(rfq.id, tenant);

    await this.audit.record({
      actorId: buyerContext.createdById,
      rfqId: rfq.id,
      action: 'RFQ_SUPPLIER_MATCHING_COMPLETED',
      entity: 'SupplierMatch',
      entityId: rfq.id,
      metadata: {
        reference: rfq.reference,
        matchedSuppliers: matching.matches.length,
        topMatch: matching.matches[0]?.supplierName,
        topScore: matching.matches[0]?.score,
      },
    });

    return {
      ...rfq,
      matching,
    };
  }

  async getOne(id: string, tenant?: TenantContext) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        buyerOrganization: true,
        lineItems: true,
        invites: { include: { supplierProfile: { include: { organization: true } } } },
        quotes: { include: { supplierProfile: { include: { organization: true } } } },
        matches: { include: { supplierProfile: { include: { organization: true } } } },
        auditLogs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (tenant) {
      this.assertCanAccessRfq(rfq, tenant);
    }
    return rfq;
  }

  async listSupplierOpportunities(tenant: TenantContext) {
    if (tenant.activeOrganization.type !== OrganizationType.SUPPLIER) {
      throw new ForbiddenException('A supplier organization is required to view matched opportunities');
    }

    const supplierProfile = await this.resolveSupplierProfileForTenant(tenant);

    const matches = await this.prisma.supplierMatch.findMany({
      where: { supplierProfileId: supplierProfile.id },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: 25,
      include: {
        rfq: {
          include: {
            buyerOrganization: true,
            lineItems: true,
            quotes: {
              where: { supplierProfileId: supplierProfile.id },
              select: { id: true, status: true },
              orderBy: { submittedAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return matches.map((match) => {
      const quote = match.rfq.quotes[0];
      const canPrepareQuote = match.rfq.status === RfqStatus.PUBLISHED || match.rfq.status === RfqStatus.QUOTATION_OPEN;

      return {
        matchId: match.id,
        rfqId: match.rfq.id,
        reference: match.rfq.reference,
        title: match.rfq.title,
        category: match.rfq.category,
        buyerName: match.rfq.buyerOrganization.name,
        score: Math.round(match.score),
        status: match.rfq.status,
        quoteStatus: quote?.status || null,
        closingDate: match.rfq.closingDate.toISOString(),
        lineItemCount: match.rfq.lineItems.length,
        actionLabel: quote ? 'View Quote' : canPrepareQuote ? 'Prepare Quote' : 'View RFQ',
      };
    });
  }

  async listBuyerRfqs(tenant: TenantContext) {
    if (tenant.activeOrganization.type !== OrganizationType.BUYER) {
      throw new ForbiddenException('A buyer organization is required to view RFQs');
    }

    const rfqs = await this.prisma.rfq.findMany({
      where: { buyerOrganizationId: tenant.activeOrganization.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        lineItems: { select: { id: true } },
        matches: { select: { id: true } },
        award: { select: { id: true, quoteId: true } },
        quotes: {
          where: { status: { not: QuoteStatus.DRAFT } },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            submittedAt: true,
          },
        },
      },
    });

    return rfqs.map((rfq) => {
      const submittedQuotes = rfq.quotes.filter((quote) => quote.status !== QuoteStatus.WITHDRAWN);
      const lowestQuote = submittedQuotes.reduce<number | null>((lowest, quote) => {
        const amount = Number(quote.totalAmount);
        if (!Number.isFinite(amount)) return lowest;
        return lowest === null ? amount : Math.min(lowest, amount);
      }, null);

      return {
        id: rfq.id,
        reference: rfq.reference,
        title: rfq.title,
        category: rfq.category,
        currency: rfq.currency,
        status: rfq.status,
        closingDate: rfq.closingDate.toISOString(),
        quoteCount: submittedQuotes.length,
        matchCount: rfq.matches.length,
        lineItemCount: rfq.lineItems.length,
        lowestQuote: lowestQuote === null ? null : lowestQuote.toString(),
        hasAward: Boolean(rfq.award),
        updatedAt: rfq.updatedAt.toISOString(),
      };
    });
  }

  async evaluateQuotes(id: string, tenant: TenantContext) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        buyerOrganization: true,
        lineItems: true,
        matches: true,
        quotes: {
          where: {
            status: {
              in: [QuoteStatus.SUBMITTED, QuoteStatus.SHORTLISTED, QuoteStatus.REJECTED, QuoteStatus.AWARDED],
            },
          },
          include: {
            supplierProfile: {
              include: {
                organization: true,
              },
            },
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertBuyerTenant(rfq.buyerOrganizationId, tenant);

    const quotes = rfq.quotes.filter((quote) => Number(quote.totalAmount) > 0);
    const amounts = quotes.map((quote) => Number(quote.totalAmount));
    const deliveryDays = quotes.map((quote) => quote.deliveryDays).filter((value) => value > 0);
    const validityDays = quotes.map((quote) => quote.validityDays).filter((value) => value > 0);
    const lowestAmount = amounts.length ? Math.min(...amounts) : 0;
    const fastestDelivery = deliveryDays.length ? Math.min(...deliveryDays) : 0;
    const longestValidity = validityDays.length ? Math.max(...validityDays) : 0;
    const averageAmount = amounts.length ? amounts.reduce((total, amount) => total + amount, 0) / amounts.length : 0;

    const evaluatedQuotes = quotes.map((quote) => {
      const amount = Number(quote.totalAmount);
      const match = rfq.matches.find((candidate) => candidate.supplierProfileId === quote.supplierProfileId);
      const supplierProfile = quote.supplierProfile;
      const supplierName = supplierProfile?.organization.name || quote.externalEmail || 'External supplier';
      const supportingDocuments = this.formatQuoteDocuments(quote.supportingDocuments);
      const matchScore = match ? Math.round(match.score) : null;
      const commercialScore = this.scoreCommercial(amount, lowestAmount, quote.validityDays, longestValidity);
      const technicalScore = this.scoreTechnical(quote.technicalResponse, quote.commercialNotes, quote.warranty, supportingDocuments.length);
      const deliveryScore = this.scoreDelivery(quote.deliveryDays, fastestDelivery);
      const supplierFitScore = this.scoreSupplierFit(supplierProfile, rfq.category, rfq.country, matchScore);
      const riskScore = this.scoreRisk(supplierProfile, quote.warranty);
      const overallScore = this.clampScore(
        commercialScore * 0.3
        + technicalScore * 0.25
        + deliveryScore * 0.2
        + supplierFitScore * 0.15
        + riskScore * 0.1,
      );
      const flags = this.evaluationFlags({
        amount,
        averageAmount,
        deliveryDays: quote.deliveryDays,
        fastestDelivery,
        technicalResponse: quote.technicalResponse,
        warranty: quote.warranty,
        supportingDocumentCount: supportingDocuments.length,
        supplierProfile,
      });
      const clarifications = this.clarificationQuestions(flags, supplierName);
      const negotiationOpportunities = this.negotiationOpportunities({
        amount,
        lowestAmount,
        deliveryDays: quote.deliveryDays,
        fastestDelivery,
        warranty: quote.warranty,
        supplierName,
      });

      return {
        quoteId: quote.id,
        supplierProfileId: quote.supplierProfileId,
        supplierName,
        supplierOrganizationId: supplierProfile?.organizationId || null,
        quoteStatus: quote.status,
        totalAmount: quote.totalAmount.toString(),
        currency: quote.currency,
        deliveryDays: quote.deliveryDays,
        validityDays: quote.validityDays,
        warranty: quote.warranty,
        submittedAt: quote.submittedAt.toISOString(),
        technicalSummary: this.technicalSummary(quote.technicalResponse),
        commercialNotes: quote.commercialNotes,
        supportingDocuments,
        supplier: {
          verificationStatus: supplierProfile?.verificationStatus || 'UNVERIFIED',
          rating: supplierProfile?.rating || 0,
          completedContracts: supplierProfile?.completedContracts || 0,
          responseRate: supplierProfile?.responseRate || 0,
          matchScore,
        },
        scores: {
          overall: overallScore,
          commercial: commercialScore,
          technical: technicalScore,
          delivery: deliveryScore,
          supplierFit: supplierFitScore,
          risk: riskScore,
        },
        flags,
        clarifications,
        negotiationOpportunities,
        badges: [
          amount === lowestAmount ? 'Lowest Cost' : null,
          quote.deliveryDays === fastestDelivery ? 'Fastest Delivery' : null,
        ].filter(Boolean),
      };
    }).sort((a, b) => b.scores.overall - a.scores.overall);
    const decisionBestValue = evaluatedQuotes.find((quote) => quote.quoteStatus === QuoteStatus.AWARDED)
      || evaluatedQuotes.find((quote) => quote.quoteStatus !== QuoteStatus.REJECTED)
      || evaluatedQuotes[0]
      || null;
    const rankedQuotes = evaluatedQuotes.map((quote, index) => ({
      ...quote,
      rank: index + 1,
      badges: quote.quoteId === decisionBestValue?.quoteId ? ['Best Value', ...quote.badges] : quote.badges,
    }));

    const bestValue = decisionBestValue
      ? rankedQuotes.find((quote) => quote.quoteId === decisionBestValue.quoteId) || null
      : null;
    const lowestCost = rankedQuotes.find((quote) => Number(quote.totalAmount) === lowestAmount) || null;
    const fastest = rankedQuotes.find((quote) => quote.deliveryDays === fastestDelivery) || null;
    const clarificationCount = rankedQuotes.reduce((total, quote) => total + quote.clarifications.length, 0);
    const evaluatedAt = new Date().toISOString();

    await this.audit.record({
      actorId: tenant.user.id,
      rfqId: rfq.id,
      action: 'QUOTE_EVALUATION_GENERATED',
      entity: 'QuoteEvaluation',
      entityId: rfq.id,
      metadata: {
        reference: rfq.reference,
        quoteCount: rankedQuotes.length,
        bestValueQuoteId: bestValue?.quoteId || null,
        lowestCostQuoteId: lowestCost?.quoteId || null,
        fastestDeliveryQuoteId: fastest?.quoteId || null,
        evaluatedAt,
      },
    });

    return {
      rfq: {
        id: rfq.id,
        reference: rfq.reference,
        title: rfq.title,
        description: rfq.description,
        category: rfq.category,
        country: rfq.country,
        deliveryLocation: rfq.deliveryLocation,
        currency: rfq.currency,
        status: rfq.status,
        closingDate: rfq.closingDate.toISOString(),
        buyerOrganization: {
          id: rfq.buyerOrganization.id,
          name: rfq.buyerOrganization.name,
        },
        lineItemCount: rfq.lineItems.length,
      },
      evaluatedAt,
      weights: [
        { label: 'Commercial', value: 30 },
        { label: 'Technical', value: 25 },
        { label: 'Delivery', value: 20 },
        { label: 'Supplier Fit', value: 15 },
        { label: 'Risk', value: 10 },
      ],
      summary: {
        quoteCount: rankedQuotes.length,
        averageQuoteAmount: averageAmount.toFixed(2),
        bestValueQuoteId: bestValue?.quoteId || null,
        lowestCostQuoteId: lowestCost?.quoteId || null,
        fastestDeliveryQuoteId: fastest?.quoteId || null,
        clarificationCount,
      },
      recommendation: bestValue ? {
        quoteId: bestValue.quoteId,
        supplierName: bestValue.supplierName,
        overallScore: bestValue.scores.overall,
        confidence: bestValue.scores.overall >= 85 ? 'High' : bestValue.scores.overall >= 72 ? 'Medium' : 'Needs Review',
        explanation: this.recommendationExplanation(bestValue, lowestCost, fastest),
      } : null,
      outcomes: [
        {
          label: 'Best Value',
          supplierName: bestValue?.supplierName || null,
          quoteId: bestValue?.quoteId || null,
          value: bestValue ? `${bestValue.scores.overall}% overall` : 'No quotes yet',
        },
        {
          label: 'Lowest Cost',
          supplierName: lowestCost?.supplierName || null,
          quoteId: lowestCost?.quoteId || null,
          value: lowestCost ? lowestCost.totalAmount : null,
        },
        {
          label: 'Fastest Delivery',
          supplierName: fastest?.supplierName || null,
          quoteId: fastest?.quoteId || null,
          value: fastest ? `${fastest.deliveryDays} days` : null,
        },
        {
          label: 'Clarifications Needed',
          supplierName: null,
          quoteId: null,
          value: String(clarificationCount),
        },
      ],
      quotes: rankedQuotes,
    };
  }

  async listMessages(id: string, tenant: TenantContext, supplierProfileId?: string) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        invites: { include: { supplierProfile: { include: { organization: true } } } },
        quotes: { include: { supplierProfile: { include: { organization: true } } } },
        matches: { include: { supplierProfile: { include: { organization: true } } } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertCanAccessRfq(rfq, tenant);

    const where: Prisma.RfqMessageWhereInput = { rfqId: id };

    if (tenant.activeOrganization.type === OrganizationType.SUPPLIER) {
      const supplierProfile = await this.resolveSupplierProfileForTenant(tenant);
      where.OR = [
        { supplierProfileId: supplierProfile.id },
        { supplierProfileId: null },
      ];
    } else if (supplierProfileId?.trim()) {
      where.supplierProfileId = supplierProfileId.trim();
    }

    const messages = await this.prisma.rfqMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return messages.map((message) => this.formatRfqMessage(message));
  }

  async createMessage(id: string, dto: RfqMessageInput, tenant: TenantContext) {
    const body = dto.body?.trim();
    const subject = dto.subject?.trim() || undefined;

    if (!body) {
      throw new BadRequestException('Message body is required');
    }
    if (body.length > 4000) {
      throw new BadRequestException('Message body must be 4,000 characters or fewer');
    }

    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        invites: { include: { supplierProfile: { include: { organization: true } } } },
        quotes: { include: { supplierProfile: { include: { organization: true } } } },
        matches: { include: { supplierProfile: { include: { organization: true } } } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertCanAccessRfq(rfq, tenant);

    let targetSupplierProfileId = dto.supplierProfileId?.trim() || undefined;
    const quoteId = dto.quoteId?.trim() || undefined;

    if (tenant.activeOrganization.type === OrganizationType.SUPPLIER) {
      const supplierProfile = await this.resolveSupplierProfileForTenant(tenant);
      targetSupplierProfileId = supplierProfile.id;
    } else {
      this.assertBuyerTenant(rfq.buyerOrganizationId, tenant);
      if (targetSupplierProfileId) {
        this.assertSupplierBelongsToRfq(rfq, targetSupplierProfileId);
      }
    }

    if (quoteId) {
      const quote = rfq.quotes.find((item) => item.id === quoteId);
      if (!quote) {
        throw new BadRequestException('Quote does not belong to this RFQ');
      }
      if (quote.supplierProfileId) {
        if (targetSupplierProfileId && targetSupplierProfileId !== quote.supplierProfileId) {
          throw new BadRequestException('Quote and supplier target do not match');
        }
        targetSupplierProfileId = quote.supplierProfileId;
      }
    }

    const message = await this.prisma.rfqMessage.create({
      data: {
        rfqId: id,
        supplierProfileId: targetSupplierProfileId,
        quoteId,
        senderUserId: tenant.user.id,
        senderUserName: tenant.user.name,
        senderOrganizationId: tenant.activeOrganization.id,
        senderOrganizationName: tenant.activeOrganization.name,
        senderOrganizationType: tenant.activeOrganization.type,
        subject,
        body,
        visibility: RfqMessageVisibility.BUYER_SUPPLIER,
      },
    });

    await this.audit.record({
      actorId: tenant.user.id,
      rfqId: id,
      action: 'RFQ_MESSAGE_CREATED',
      entity: 'RfqMessage',
      entityId: message.id,
      metadata: {
        reference: rfq.reference,
        supplierProfileId: targetSupplierProfileId || null,
        quoteId: quoteId || null,
        senderOrganizationId: tenant.activeOrganization.id,
      },
    });

    return this.formatRfqMessage(message);
  }

  async updateQuoteDecision(id: string, quoteId: string, dto: QuoteDecisionInput, tenant: TenantContext) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        rfq: true,
        supplierProfile: { include: { organization: true } },
      },
    });

    if (!quote || quote.rfqId !== id) throw new NotFoundException('Quote not found for this RFQ');
    this.assertBuyerTenant(quote.rfq.buyerOrganizationId, tenant);

    if (quote.rfq.status === RfqStatus.AWARDED || quote.status === QuoteStatus.AWARDED) {
      throw new ForbiddenException('This RFQ already has an awarded quote');
    }
    if (quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.WITHDRAWN) {
      throw new BadRequestException('Only submitted quotes can be evaluated');
    }

    const status = dto.status === 'SHORTLISTED' ? QuoteStatus.SHORTLISTED : QuoteStatus.REJECTED;
    const updatedQuote = await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status },
      include: {
        supplierProfile: { include: { organization: true } },
      },
    });

    if (status === QuoteStatus.SHORTLISTED && quote.rfq.status !== RfqStatus.EVALUATION) {
      await this.prisma.rfq.update({
        where: { id },
        data: { status: RfqStatus.EVALUATION },
      });
    }

    await this.audit.record({
      actorId: tenant.user.id,
      rfqId: id,
      action: status === QuoteStatus.SHORTLISTED ? 'QUOTE_SHORTLISTED' : 'QUOTE_REJECTED',
      entity: 'Quote',
      entityId: quote.id,
      metadata: {
        reference: quote.rfq.reference,
        quoteId: quote.id,
        supplierName: updatedQuote.supplierProfile?.organization.name || updatedQuote.externalEmail || 'External supplier',
        note: dto.note || null,
      },
    });

    return this.quoteDecisionSummary(updatedQuote);
  }

  async awardQuote(id: string, dto: AwardQuoteInput, tenant: TenantContext) {
    if (!dto.quoteId?.trim()) {
      throw new BadRequestException('A quote is required for award');
    }

    const quote = await this.prisma.quote.findUnique({
      where: { id: dto.quoteId },
      include: {
        rfq: { include: { award: true } },
        supplierProfile: { include: { organization: true } },
      },
    });

    if (!quote || quote.rfqId !== id) throw new NotFoundException('Quote not found for this RFQ');
    this.assertBuyerTenant(quote.rfq.buyerOrganizationId, tenant);

    if (quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.WITHDRAWN || quote.status === QuoteStatus.REJECTED) {
      throw new BadRequestException('Only active submitted or shortlisted quotes can be awarded');
    }

    if (quote.rfq.award) {
      if (quote.rfq.award.quoteId === quote.id) {
        return {
          award: {
            id: quote.rfq.award.id,
            quoteId: quote.rfq.award.quoteId,
            awardedAt: quote.rfq.award.awardedAt.toISOString(),
            decisionNote: quote.rfq.award.decisionNote,
          },
          awardedQuote: this.quoteDecisionSummary(quote),
        };
      }
      throw new ForbiddenException('This RFQ already has an awarded quote');
    }

    const decisionNote = dto.decisionNote?.trim() || 'Awarded through Quote Evaluation.';
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.quote.updateMany({
        where: {
          rfqId: id,
          id: { not: quote.id },
          status: { in: [QuoteStatus.SUBMITTED, QuoteStatus.SHORTLISTED] },
        },
        data: { status: QuoteStatus.REJECTED },
      });

      const awardedQuote = await tx.quote.update({
        where: { id: quote.id },
        data: { status: QuoteStatus.AWARDED },
        include: {
          supplierProfile: { include: { organization: true } },
        },
      });

      const award = await tx.award.create({
        data: {
          rfqId: id,
          quoteId: quote.id,
          decisionNote,
          awardedById: tenant.user.id,
        },
      });

      const rfq = await tx.rfq.update({
        where: { id },
        data: { status: RfqStatus.AWARDED },
      });

      return { award, awardedQuote, rfq };
    });

    await this.audit.record({
      actorId: tenant.user.id,
      rfqId: id,
      action: 'QUOTE_AWARDED',
      entity: 'Award',
      entityId: result.award.id,
      metadata: {
        reference: result.rfq.reference,
        quoteId: quote.id,
        supplierName: result.awardedQuote.supplierProfile?.organization.name || result.awardedQuote.externalEmail || 'External supplier',
        totalAmount: result.awardedQuote.totalAmount.toString(),
        currency: result.awardedQuote.currency,
        decisionNote,
      },
    });

    return {
      award: {
        id: result.award.id,
        quoteId: result.award.quoteId,
        awardedAt: result.award.awardedAt.toISOString(),
        decisionNote: result.award.decisionNote,
      },
      awardedQuote: this.quoteDecisionSummary(result.awardedQuote),
    };
  }

  async getSupplierOpportunityDetail(id: string, tenant: TenantContext) {
    if (tenant.activeOrganization.type !== OrganizationType.SUPPLIER) {
      throw new ForbiddenException('A supplier organization is required to view RFQ opportunities');
    }

    const supplierProfile = await this.resolveSupplierProfileForTenant(tenant);

    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        buyerOrganization: true,
        lineItems: true,
        invites: { include: { supplierProfile: { include: { organization: true } } } },
        quotes: {
          where: { supplierProfileId: supplierProfile.id },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
        matches: {
          where: { supplierProfileId: supplierProfile.id },
          include: { supplierProfile: { include: { organization: true } } },
        },
        messages: {
          where: {
            OR: [
              { supplierProfileId: supplierProfile.id },
              { supplierProfileId: null },
            ],
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertCanAccessRfq({
      buyerOrganizationId: rfq.buyerOrganizationId,
      status: rfq.status,
      matches: rfq.matches,
      quotes: rfq.quotes.map((quote) => ({
        supplierProfileId: quote.supplierProfileId,
        supplierProfile: { organizationId: tenant.activeOrganization.id },
      })),
      invites: rfq.invites,
    }, tenant);

    const match = rfq.matches[0];
    const quote = rfq.quotes[0];

    return {
      id: rfq.id,
      reference: rfq.reference,
      title: rfq.title,
      description: rfq.description,
      category: rfq.category,
      country: rfq.country,
      deliveryLocation: rfq.deliveryLocation,
      currency: rfq.currency,
      estimatedBudget: rfq.estimatedBudget?.toString() || null,
      closingDate: rfq.closingDate.toISOString(),
      status: rfq.status,
      technicalNotes: rfq.technicalNotes,
      supportingDocuments: rfq.supportingDocuments,
      buyerOrganization: {
        id: rfq.buyerOrganization.id,
        name: rfq.buyerOrganization.name,
        country: rfq.buyerOrganization.country,
        status: rfq.buyerOrganization.status,
      },
      lineItems: rfq.lineItems.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
      })),
      match: match ? {
        id: match.id,
        score: Math.round(match.score),
        explanation: match.explanation,
      } : null,
      quote: quote ? {
        id: quote.id,
        status: quote.status,
        totalAmount: quote.totalAmount.toString(),
        currency: quote.currency,
        deliveryDays: quote.deliveryDays,
        validityDays: quote.validityDays,
        warranty: quote.warranty,
        technicalResponse: quote.technicalResponse,
        commercialNotes: quote.commercialNotes,
        supportingDocuments: this.formatQuoteDocuments(quote.supportingDocuments),
        submittedAt: quote.submittedAt.toISOString(),
      } : null,
      messages: rfq.messages.map((message) => this.formatRfqMessage(message)),
      canQuote: rfq.status === RfqStatus.PUBLISHED || rfq.status === RfqStatus.QUOTATION_OPEN,
    };
  }

  async submitSupplierQuote(id: string, dto: SupplierQuoteInput, tenant: TenantContext) {
    if (tenant.activeOrganization.type !== OrganizationType.SUPPLIER) {
      throw new ForbiddenException('A supplier organization is required to submit quotes');
    }

    const supplierProfile = await this.resolveSupplierProfileForTenant(tenant);

    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        invites: { include: { supplierProfile: { include: { organization: true } } } },
        quotes: { include: { supplierProfile: { include: { organization: true } } } },
        matches: { include: { supplierProfile: { include: { organization: true } } } },
      },
    });
    if (!rfq) throw new NotFoundException('RFQ not found');
    this.assertCanAccessRfq(rfq, tenant);

    if (rfq.status !== RfqStatus.PUBLISHED && rfq.status !== RfqStatus.QUOTATION_OPEN) {
      throw new ForbiddenException('This RFQ is not open for quotes');
    }

    const status = dto.status === 'DRAFT' ? QuoteStatus.DRAFT : QuoteStatus.SUBMITTED;
    const existingQuote = await this.prisma.quote.findFirst({
      where: {
        rfqId: id,
        supplierProfileId: supplierProfile.id,
      },
      orderBy: { submittedAt: 'desc' },
    });

    const technicalResponse = (dto.technicalResponse || {}) as Prisma.InputJsonObject;
    const supportingDocuments = this.normalizeQuoteDocuments(dto.supportingDocuments);
    const quoteData = {
      totalAmount: new Prisma.Decimal(dto.totalAmount),
      currency: dto.currency || rfq.currency,
      deliveryDays: dto.deliveryDays,
      validityDays: dto.validityDays,
      warranty: dto.warranty,
      status,
      technicalResponse,
      commercialNotes: dto.commercialNotes,
      supportingDocuments,
    };

    const quote = existingQuote
      ? await this.prisma.quote.update({
        where: { id: existingQuote.id },
        data: quoteData,
      })
      : await this.prisma.quote.create({
        data: {
          ...quoteData,
          rfqId: id,
          supplierProfileId: supplierProfile.id,
        },
      });

    await this.audit.record({
      actorId: tenant.user.id,
      rfqId: id,
      action: status === QuoteStatus.DRAFT ? 'QUOTE_DRAFT_SAVED' : 'QUOTE_SUBMITTED',
      entity: 'Quote',
      entityId: quote.id,
      metadata: {
        reference: rfq.reference,
        supplierOrganizationId: tenant.activeOrganization.id,
        totalAmount: quote.totalAmount.toString(),
        currency: quote.currency,
        supportingDocuments: supportingDocuments.length,
      },
    });

    return {
      id: quote.id,
      status: quote.status,
      totalAmount: quote.totalAmount.toString(),
      currency: quote.currency,
      deliveryDays: quote.deliveryDays,
      validityDays: quote.validityDays,
      warranty: quote.warranty,
      technicalResponse: quote.technicalResponse,
      commercialNotes: quote.commercialNotes,
      supportingDocuments: this.formatQuoteDocuments(quote.supportingDocuments),
      submittedAt: quote.submittedAt.toISOString(),
    };
  }

  async publish(id: string, tenant?: TenantContext) {
    const existing = await this.prisma.rfq.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('RFQ not found');
    if (tenant) {
      this.assertBuyerTenant(existing.buyerOrganizationId, tenant);
    }

    const rfq = await this.prisma.rfq.update({
      where: { id },
      data: { status: RfqStatus.QUOTATION_OPEN },
    });

    await this.audit.record({
      rfqId: id,
      action: 'RFQ_PUBLISHED',
      entity: 'Rfq',
      entityId: id,
      metadata: { reference: rfq.reference },
    });

    return rfq;
  }

  private quoteDecisionSummary(quote: {
    id: string;
    status: QuoteStatus;
    totalAmount: Prisma.Decimal;
    currency: string;
    deliveryDays: number;
    validityDays: number;
    supplierProfile?: {
      organization?: {
        name: string;
      };
    } | null;
    externalEmail?: string | null;
    updatedAt?: Date;
  }) {
    return {
      quoteId: quote.id,
      status: quote.status,
      supplierName: quote.supplierProfile?.organization?.name || quote.externalEmail || 'External supplier',
      totalAmount: quote.totalAmount.toString(),
      currency: quote.currency,
      deliveryDays: quote.deliveryDays,
      validityDays: quote.validityDays,
      updatedAt: quote.updatedAt?.toISOString() || null,
    };
  }

  private scoreCommercial(amount: number, lowestAmount: number, validityDays: number, longestValidity: number) {
    const priceScore = amount > 0 && lowestAmount > 0 ? (lowestAmount / amount) * 100 : 0;
    const validityScore = validityDays > 0 && longestValidity > 0 ? (validityDays / longestValidity) * 100 : 45;
    return this.clampScore(priceScore * 0.82 + validityScore * 0.18);
  }

  private scoreTechnical(technicalResponse: Prisma.JsonValue | null, commercialNotes?: string | null, warranty?: string | null, supportingDocumentCount = 0) {
    const summaryLength = this.technicalSummary(technicalResponse).length;
    const responseScore = summaryLength >= 300 ? 100 : summaryLength >= 120 ? 84 : summaryLength >= 40 ? 66 : 35;
    const warrantyScore = warranty?.trim() ? 88 : 44;
    const notesScore = commercialNotes?.trim() ? 78 : 50;
    const documentScore = supportingDocumentCount > 0 ? 90 : 45;
    return this.clampScore(responseScore * 0.56 + warrantyScore * 0.18 + notesScore * 0.14 + documentScore * 0.12);
  }

  private scoreDelivery(deliveryDays: number, fastestDelivery: number) {
    if (!deliveryDays || !fastestDelivery) return 0;
    const deliveryRatio = (fastestDelivery / deliveryDays) * 100;
    const urgencyScore = deliveryDays <= 14 ? 100 : deliveryDays <= 30 ? 88 : deliveryDays <= 60 ? 76 : deliveryDays <= 90 ? 66 : 52;
    return this.clampScore(deliveryRatio * 0.78 + urgencyScore * 0.22);
  }

  private scoreSupplierFit(
    supplierProfile: EvaluationSupplierProfile,
    category: string,
    country: string,
    matchScore: number | null,
  ) {
    const categoryFit = supplierProfile?.categories.some((candidate) => this.sameText(candidate, category)) ? 100 : 55;
    const countryFit = supplierProfile?.countriesServed.some((candidate) => this.sameText(candidate, country)) ? 100 : 70;
    const verificationFit = supplierProfile?.verificationStatus === 'VERIFIED' ? 100 : supplierProfile?.verificationStatus === 'PENDING_REVIEW' ? 68 : 45;
    const profileScore = categoryFit * 0.45 + countryFit * 0.25 + verificationFit * 0.3;
    return this.clampScore((matchScore || profileScore) * 0.68 + profileScore * 0.32);
  }

  private scoreRisk(supplierProfile: EvaluationSupplierProfile, warranty?: string | null) {
    if (!supplierProfile) return warranty?.trim() ? 55 : 42;

    const verificationScore = supplierProfile.verificationStatus === 'VERIFIED'
      ? 100
      : supplierProfile.verificationStatus === 'PENDING_REVIEW'
        ? 68
        : supplierProfile.verificationStatus === 'SUSPENDED'
          ? 10
          : 45;
    const ratingScore = supplierProfile.rating > 0 ? Math.min(100, (supplierProfile.rating / 5) * 100) : 55;
    const normalizedResponseRate = supplierProfile.responseRate <= 1 ? supplierProfile.responseRate * 100 : supplierProfile.responseRate;
    const responseRateScore = normalizedResponseRate > 0 ? Math.min(100, normalizedResponseRate) : 48;
    const contractScore = Math.min(100, 42 + supplierProfile.completedContracts * 3);
    const warrantyScore = warranty?.trim() ? 86 : 48;

    return this.clampScore(
      verificationScore * 0.3
      + ratingScore * 0.2
      + responseRateScore * 0.2
      + contractScore * 0.2
      + warrantyScore * 0.1,
    );
  }

  private evaluationFlags(input: {
    amount: number;
    averageAmount: number;
    deliveryDays: number;
    fastestDelivery: number;
    technicalResponse: Prisma.JsonValue | null;
    warranty?: string | null;
    supportingDocumentCount: number;
    supplierProfile: EvaluationSupplierProfile;
  }) {
    const flags: string[] = [];
    const normalizedResponseRate = input.supplierProfile
      ? input.supplierProfile.responseRate <= 1
        ? input.supplierProfile.responseRate * 100
        : input.supplierProfile.responseRate
      : 0;

    if (input.averageAmount > 0 && input.amount > input.averageAmount * 1.15) {
      flags.push('Price is above the quote average');
    }
    if (input.fastestDelivery > 0 && input.deliveryDays > input.fastestDelivery * 1.25) {
      flags.push('Delivery timeline is slower than leading quote');
    }
    if (this.technicalSummary(input.technicalResponse).length < 40) {
      flags.push('Technical response needs more detail');
    }
    if (!input.warranty?.trim()) {
      flags.push('Warranty or support terms are missing');
    }
    if (input.supportingDocumentCount === 0) {
      flags.push('Quote supporting documents are missing');
    }
    if (!input.supplierProfile || input.supplierProfile.verificationStatus !== 'VERIFIED') {
      flags.push('Supplier verification should be checked');
    }
    if (normalizedResponseRate > 0 && normalizedResponseRate < 50) {
      flags.push('Supplier response rate is below target');
    }

    return flags;
  }

  private clarificationQuestions(flags: string[], supplierName: string) {
    const questions = flags.map((flag) => {
      if (flag.includes('Price')) return `Ask ${supplierName} to confirm whether pricing can be aligned with the competitive range.`;
      if (flag.includes('Delivery')) return `Ask ${supplierName} to confirm whether delivery can be accelerated without changing scope.`;
      if (flag.includes('Technical')) return `Ask ${supplierName} to expand the technical approach, delivery assumptions, and implementation controls.`;
      if (flag.includes('Warranty')) return `Ask ${supplierName} to clarify warranty, support coverage, and escalation commitments.`;
      if (flag.includes('supporting documents')) return `Ask ${supplierName} to provide proposal, pricing, compliance, or certification documents for review.`;
      if (flag.includes('verification')) return `Confirm ${supplierName}'s verification status and required compliance documents.`;
      if (flag.includes('response rate')) return `Ask ${supplierName} to confirm response-time commitments during delivery.`;
      return `Clarify ${flag.toLowerCase()} with ${supplierName}.`;
    });

    return questions.slice(0, 4);
  }

  private negotiationOpportunities(input: {
    amount: number;
    lowestAmount: number;
    deliveryDays: number;
    fastestDelivery: number;
    warranty?: string | null;
    supplierName: string;
  }) {
    const opportunities: string[] = [];
    if (input.lowestAmount > 0 && input.amount > input.lowestAmount) {
      opportunities.push(`${input.supplierName} is priced above the lowest quote; request a value or price alignment option.`);
    }
    if (input.fastestDelivery > 0 && input.deliveryDays > input.fastestDelivery) {
      opportunities.push(`${input.supplierName} can be asked for an accelerated delivery option.`);
    }
    if (!input.warranty?.trim()) {
      opportunities.push(`${input.supplierName} should confirm warranty and post-award support terms.`);
    }
    return opportunities;
  }

  private recommendationExplanation(
    bestValue: { supplierName: string; badges: Array<string | null>; scores: { overall: number; commercial: number; technical: number; delivery: number; risk: number } },
    lowestCost: { quoteId: string; supplierName: string } | null,
    fastest: { quoteId: string; supplierName: string } | null,
  ) {
    const reasons = [
      `${bestValue.supplierName} has the strongest weighted score at ${bestValue.scores.overall}%.`,
      `Commercial score is ${bestValue.scores.commercial}% and technical score is ${bestValue.scores.technical}%.`,
      `Delivery score is ${bestValue.scores.delivery}% with a risk score of ${bestValue.scores.risk}%.`,
    ];

    if (lowestCost && lowestCost.supplierName !== bestValue.supplierName) {
      reasons.push(`${lowestCost.supplierName} remains the lowest cost option for negotiation comparison.`);
    }
    if (fastest && fastest.supplierName !== bestValue.supplierName) {
      reasons.push(`${fastest.supplierName} remains the fastest delivery option.`);
    }

    return reasons.join(' ');
  }

  private technicalSummary(technicalResponse: Prisma.JsonValue | null | undefined) {
    if (!technicalResponse || typeof technicalResponse !== 'object' || Array.isArray(technicalResponse)) return '';
    const summary = (technicalResponse as Record<string, unknown>).summary;
    return typeof summary === 'string' ? summary : '';
  }

  private normalizeQuoteDocuments(documents?: Array<Record<string, unknown>>): Prisma.InputJsonArray {
    if (!Array.isArray(documents)) return [];

    return documents.slice(0, 10).map((document, index) => {
      const name = typeof document.name === 'string' && document.name.trim()
        ? document.name.trim()
        : `Quote document ${index + 1}`;
      const type = typeof document.type === 'string' && document.type.trim()
        ? document.type.trim()
        : 'application/octet-stream';
      const size = typeof document.size === 'number' || typeof document.size === 'string'
        ? document.size
        : '';
      const category = typeof document.category === 'string' && document.category.trim()
        ? document.category.trim()
        : 'Quote Document';
      const url = typeof document.url === 'string' && document.url.trim()
        ? document.url.trim()
        : undefined;
      const storageKey = typeof document.storageKey === 'string' && document.storageKey.trim()
        ? document.storageKey.trim()
        : undefined;

      return {
        name,
        type,
        size,
        category,
        ...(storageKey ? { storageKey } : {}),
        ...(url ? { url } : {}),
      };
    }) as Prisma.InputJsonArray;
  }

  private formatQuoteDocuments(value: Prisma.JsonValue | null | undefined) {
    if (!Array.isArray(value)) return [];

    return value.map((document, index) => {
      if (!document || typeof document !== 'object' || Array.isArray(document)) {
        return {
          name: `Quote document ${index + 1}`,
          type: 'FILE',
          size: '',
          category: 'Quote Document',
          storageKey: null,
          url: null,
        };
      }

      const record = document as Record<string, unknown>;
      return {
        name: typeof record.name === 'string' && record.name.trim() ? record.name : `Quote document ${index + 1}`,
        type: typeof record.type === 'string' && record.type.trim() ? record.type : 'FILE',
        size: typeof record.size === 'number' || typeof record.size === 'string' ? String(record.size) : '',
        category: typeof record.category === 'string' && record.category.trim() ? record.category : 'Quote Document',
        storageKey: typeof record.storageKey === 'string' && record.storageKey.trim() ? record.storageKey : null,
        url: typeof record.url === 'string' && record.url.trim() ? record.url : null,
      };
    });
  }

  private sameText(a: string, b: string) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  private clampScore(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private async resolveSupplierProfileForTenant(tenant: TenantContext) {
    if (tenant.activeOrganization.type !== OrganizationType.SUPPLIER) {
      throw new ForbiddenException('A supplier organization is required');
    }

    const supplierProfile = await this.prisma.supplierProfile.findUnique({
      where: { organizationId: tenant.activeOrganization.id },
      select: { id: true, verificationStatus: true },
    });
    if (!supplierProfile) {
      throw new ForbiddenException('A supplier profile is required');
    }
    if (supplierProfile.verificationStatus === SupplierVerificationStatus.SUSPENDED) {
      throw new ForbiddenException('This supplier profile is suspended from quotation activity');
    }

    return supplierProfile;
  }

  private assertSupplierBelongsToRfq(
    rfq: {
      matches: Array<{ supplierProfileId: string }>;
      quotes: Array<{ supplierProfileId: string | null }>;
      invites: Array<{ supplierProfileId: string | null }>;
    },
    supplierProfileId: string,
  ) {
    const belongsToRfq = rfq.matches.some((match) => match.supplierProfileId === supplierProfileId)
      || rfq.quotes.some((quote) => quote.supplierProfileId === supplierProfileId)
      || rfq.invites.some((invite) => invite.supplierProfileId === supplierProfileId);

    if (!belongsToRfq) {
      throw new BadRequestException('Supplier is not linked to this RFQ');
    }
  }

  private formatRfqMessage(message: {
    id: string;
    rfqId: string;
    supplierProfileId: string | null;
    quoteId: string | null;
    senderUserId: string;
    senderUserName: string;
    senderOrganizationId: string;
    senderOrganizationName: string;
    senderOrganizationType: OrganizationType;
    subject: string | null;
    body: string;
    visibility: RfqMessageVisibility;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: message.id,
      rfqId: message.rfqId,
      supplierProfileId: message.supplierProfileId,
      quoteId: message.quoteId,
      senderUserId: message.senderUserId,
      senderUserName: message.senderUserName,
      senderOrganizationId: message.senderOrganizationId,
      senderOrganizationName: message.senderOrganizationName,
      senderOrganizationType: message.senderOrganizationType,
      subject: message.subject,
      body: message.body,
      visibility: message.visibility,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
    };
  }

  private async resolveBuyerContext(dto: CreateRfqDto, tenant?: TenantContext) {
    if (tenant) {
      if (tenant.activeOrganization.type !== OrganizationType.BUYER) {
        throw new ForbiddenException('A buyer organization is required to create RFQs');
      }
      return {
        buyerOrganizationId: tenant.activeOrganization.id,
        createdById: tenant.user.id,
      };
    }

    if (dto.buyerOrganizationId && dto.createdById) {
      return {
        buyerOrganizationId: dto.buyerOrganizationId,
        createdById: dto.createdById,
      };
    }

    const buyerOrganization = await this.prisma.organization.findFirst({
      where: { type: OrganizationType.BUYER },
      orderBy: { createdAt: 'asc' },
    });

    const organization = buyerOrganization || await this.prisma.organization.create({
      data: {
        name: 'TheDigiHubs Buyer Workspace',
        slug: 'thedigihubs-buyer-workspace',
        type: OrganizationType.BUYER,
        country: dto.country,
        description: 'Default buyer workspace for RFQ creation.',
      },
    });

    const user = await this.prisma.user.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'asc' },
    });

    if (user) {
      return {
        buyerOrganizationId: organization.id,
        createdById: user.id,
      };
    }

    const createdUser = await this.prisma.user.create({
      data: {
        email: `buyer+${organization.id}@thedigihubs.local`,
        name: 'Procurement Manager',
        passwordHash: await bcrypt.hash(randomBytes(32).toString('base64url'), 12),
        role: RoleKey.BUYER_MANAGER,
        organizationId: organization.id,
      },
    });

    return {
      buyerOrganizationId: organization.id,
      createdById: createdUser.id,
    };
  }

  private assertBuyerTenant(buyerOrganizationId: string, tenant: TenantContext) {
    if (tenant.role === RoleKey.PLATFORM_ADMIN || tenant.role === RoleKey.PLATFORM_SUPPORT) return;
    if (tenant.activeOrganization.type !== OrganizationType.BUYER || tenant.activeOrganization.id !== buyerOrganizationId) {
      throw new ForbiddenException('RFQ does not belong to the active buyer organization');
    }
  }

  private assertCanAccessRfq(rfq: RfqAccessContext, tenant: TenantContext) {
    if (tenant.role === RoleKey.PLATFORM_ADMIN || tenant.role === RoleKey.PLATFORM_SUPPORT) return;
    if (tenant.activeOrganization.type === OrganizationType.BUYER) {
      this.assertBuyerTenant(rfq.buyerOrganizationId, tenant);
      return;
    }
    if (tenant.activeOrganization.type === OrganizationType.SUPPLIER) {
      const supplierProfileId = rfq.matches.find((match) => match.supplierProfile.organizationId === tenant.activeOrganization.id)?.supplierProfileId
        || rfq.quotes.find((quote) => quote.supplierProfile?.organizationId === tenant.activeOrganization.id)?.supplierProfileId
        || rfq.invites.find((invite) => invite.supplierProfile?.organizationId === tenant.activeOrganization.id)?.supplierProfileId;
      if (supplierProfileId || rfq.status === RfqStatus.PUBLISHED || rfq.status === RfqStatus.QUOTATION_OPEN) return;
    }
    throw new ForbiddenException('RFQ is not accessible to this organization');
  }
}
