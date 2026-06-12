import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationStatus, OrganizationType, RoleKey, SupplierVerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../auth/auth.types';

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  async matchSuppliersForRfq(rfqId: string, tenant?: TenantContext) {
    const rfq = await this.prisma.rfq.findUnique({ where: { id: rfqId }, include: { lineItems: true } });
    if (!rfq) throw new NotFoundException('RFQ not found');
    if (tenant && tenant.role !== RoleKey.PLATFORM_ADMIN && tenant.role !== RoleKey.PLATFORM_SUPPORT) {
      if (tenant.activeOrganization.type !== OrganizationType.BUYER || tenant.activeOrganization.id !== rfq.buyerOrganizationId) {
        throw new ForbiddenException('RFQ does not belong to the active buyer organization');
      }
    }

    const suppliers = await this.prisma.supplierProfile.findMany({
      where: {
        verificationStatus: { not: SupplierVerificationStatus.SUSPENDED },
        organization: { status: OrganizationStatus.ACTIVE },
      },
      include: { organization: true },
    });
    const results = suppliers.map((supplier) => {
      const categoryScore = supplier.categories.includes(rfq.category) ? 30 : 0;
      const countryScore = supplier.countriesServed.includes(rfq.country) ? 20 : 0;
      const verificationScore = supplier.verificationStatus === 'VERIFIED' ? 15 : 0;
      const ratingScore = Math.min(supplier.rating, 5) * 5;
      const responseScore = Math.min(supplier.responseRate, 100) / 10;
      const keywordText = `${rfq.title} ${rfq.description} ${rfq.lineItems.map((i) => i.name).join(' ')}`.toLowerCase();
      const keywordHits = supplier.keywords.filter((k) => keywordText.includes(k.toLowerCase())).length;
      const keywordScore = Math.min(keywordHits * 5, 15);
      const score = categoryScore + countryScore + verificationScore + ratingScore + responseScore + keywordScore;

      return {
        supplierProfileId: supplier.id,
        supplierName: supplier.organization.name,
        score: Math.round(score * 10) / 10,
        explanation: {
          categoryScore,
          countryScore,
          verificationScore,
          ratingScore,
          responseScore,
          keywordScore,
          reasons: [
            categoryScore ? 'Supplier category matches the RFQ category.' : 'Supplier category is not an exact match.',
            countryScore ? 'Supplier serves the delivery country.' : 'Supplier does not list this country as a primary service country.',
            verificationScore ? 'Supplier is verified.' : 'Supplier verification needs review.',
          ],
        },
      };
    }).sort((a, b) => b.score - a.score);

    for (const result of results.slice(0, 10)) {
      await this.prisma.supplierMatch.upsert({
        where: { rfqId_supplierProfileId: { rfqId, supplierProfileId: result.supplierProfileId } },
        update: { score: result.score, explanation: result.explanation },
        create: { rfqId, supplierProfileId: result.supplierProfileId, score: result.score, explanation: result.explanation },
      });
    }

    return { rfqId, matches: results.slice(0, 10) };
  }
}
