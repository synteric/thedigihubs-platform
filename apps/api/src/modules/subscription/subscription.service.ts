import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus, OrganizationType, PlanKey, SubscriptionRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../auth/auth.types';
import { NotificationService } from '../notification/notification.service';

type CreateSubscriptionRequestInput = {
  selectedPlan: PlanKey;
  name: string;
  email: string;
  organizationName: string;
  organizationType?: OrganizationType;
  phone?: string;
  country?: string;
  website?: string;
  category?: string;
  estimatedUsers?: string;
  notes?: string;
};

type ReviewSubscriptionRequestInput = {
  status: SubscriptionRequestStatus;
  decisionNote?: string;
};

const planOrder: Record<PlanKey, number> = {
  STARTER: 0,
  GROWTH: 1,
  PROFESSIONAL: 2,
  ENTERPRISE: 3,
};

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async plans() {
    const plans = await this.prisma.membershipPlan.findMany();
    return [...plans]
      .sort((a, b) => planOrder[a.key] - planOrder[b.key])
      .map((plan) => ({
        id: plan.id,
        key: plan.key,
        name: plan.name,
        description: plan.description,
        features: plan.features,
      }));
  }

  async create(input: CreateSubscriptionRequestInput) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const organizationName = input.organizationName.trim();

    if (!name || !email || !organizationName) {
      throw new BadRequestException('Name, email, and organization are required');
    }

    const request = await this.prisma.subscriptionRequest.create({
      data: {
        selectedPlan: input.selectedPlan,
        name,
        email,
        organizationName,
        organizationType: input.organizationType,
        phone: this.clean(input.phone),
        country: this.clean(input.country),
        website: this.clean(input.website),
        category: this.clean(input.category),
        estimatedUsers: this.clean(input.estimatedUsers),
        notes: this.clean(input.notes),
      },
    });

    void this.notifications.sendToSupport({
      subject: `TheDigiHubs subscription request: ${request.organizationName} (${request.selectedPlan})`,
      replyTo: request.email,
      text: [
        `A new subscription request was submitted to TheDigiHubs.`,
        '',
        `Plan: ${request.selectedPlan}`,
        `Name: ${request.name}`,
        `Email: ${request.email}`,
        `Organization: ${request.organizationName}`,
        request.organizationType ? `Organization type: ${request.organizationType}` : null,
        request.phone ? `Phone: ${request.phone}` : null,
        request.country ? `Country: ${request.country}` : null,
        request.website ? `Website: ${request.website}` : null,
        request.category ? `Category: ${request.category}` : null,
        request.estimatedUsers ? `Estimated users: ${request.estimatedUsers}` : null,
        '',
        request.notes ? `Notes:\n${request.notes}` : null,
      ].filter(Boolean).join('\n'),
    });

    void this.notifications.sendEmail({
      to: request.email,
      subject: `TheDigiHubs received your ${request.selectedPlan} plan request`,
      text: [
        `Hello ${request.name},`,
        '',
        `Thank you for requesting access to the ${request.selectedPlan} plan on TheDigiHubs.`,
        '',
        `Organization: ${request.organizationName}`,
        `Status: Pending admin review`,
        '',
        `Our team will review the request and assign the correct platform access for your plan.`,
        '',
        `For questions, contact ${this.notifications.supportEmail()}.`,
        '',
        'TheDigiHubs Support',
      ].join('\n'),
    });

    return request;
  }

  list() {
    return this.prisma.subscriptionRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async current(tenant: TenantContext) {
    const latestRequest = await this.prisma.subscriptionRequest.findFirst({
      where: {
        email: tenant.user.email,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    const activePlan = tenant.plan || PlanKey.STARTER;
    const requestedPlan = latestRequest?.selectedPlan;
    const requestOutranksActive = requestedPlan ? planOrder[requestedPlan] > planOrder[activePlan] : false;
    const status = latestRequest?.status;
    const accessState = activePlan !== PlanKey.STARTER
      ? 'ACTIVE'
      : status === SubscriptionRequestStatus.PENDING_REVIEW && requestOutranksActive
        ? 'UNDER_REVIEW'
        : status === SubscriptionRequestStatus.REJECTED && requestOutranksActive
          ? 'REJECTED'
          : 'SAMPLE_ACCESS';

    return {
      accessState,
      activePlan,
      activeFeatures: tenant.features,
      request: latestRequest ? {
        id: latestRequest.id,
        selectedPlan: latestRequest.selectedPlan,
        status: latestRequest.status,
        createdAt: latestRequest.createdAt,
        reviewedAt: latestRequest.reviewedAt,
        decisionNote: latestRequest.decisionNote,
      } : null,
    };
  }

  async review(id: string, input: ReviewSubscriptionRequestInput, tenant: TenantContext) {
    const request = await this.prisma.subscriptionRequest.findUnique({ where: { id } });
    if (!request) {
      throw new NotFoundException('Subscription request not found');
    }

    const reviewedAt = input.status === SubscriptionRequestStatus.PENDING_REVIEW ? null : new Date();

    const reviewedRequest = await this.prisma.$transaction(async (tx) => {
      let assignmentApplied = false;

      if (input.status === SubscriptionRequestStatus.APPROVED) {
        const user = await tx.user.findUnique({
          where: { email: request.email },
          include: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE },
              orderBy: { isDefault: 'desc' },
              take: 1,
            },
          },
        });
        const organizationId = user?.organizationId || user?.memberships[0]?.organizationId;
        const plan = await tx.membershipPlan.findUnique({ where: { key: request.selectedPlan } });

        if (organizationId && plan) {
          const now = new Date();
          await tx.organizationPlanAssignment.updateMany({
            where: {
              organizationId,
              isActive: true,
            },
            data: {
              isActive: false,
              endsAt: now,
            },
          });
          await tx.organizationPlanAssignment.upsert({
            where: {
              organizationId_planId: {
                organizationId,
                planId: plan.id,
              },
            },
            update: {
              isActive: true,
              startsAt: now,
              endsAt: null,
            },
            create: {
              organizationId,
              planId: plan.id,
              isActive: true,
              startsAt: now,
            },
          });
          assignmentApplied = true;
        }
      }

      const updated = await tx.subscriptionRequest.update({
        where: { id },
        data: {
          status: input.status,
          decisionNote: this.clean(input.decisionNote),
          reviewedById: tenant.user.id,
          reviewedAt,
        },
      });

      return {
        ...updated,
        assignmentApplied,
      };
    });

    void this.notifications.sendEmail({
      to: reviewedRequest.email,
      subject: `TheDigiHubs plan request ${reviewedRequest.status.toLowerCase().replace(/_/g, ' ')}`,
      text: [
        `Hello ${reviewedRequest.name},`,
        '',
        `Your ${reviewedRequest.selectedPlan} plan request for ${reviewedRequest.organizationName} has been reviewed.`,
        '',
        `Status: ${reviewedRequest.status}`,
        reviewedRequest.assignmentApplied ? `Access update: Your plan access has been assigned.` : null,
        reviewedRequest.decisionNote ? `Admin note: ${reviewedRequest.decisionNote}` : null,
        '',
        `For questions, contact ${this.notifications.supportEmail()}.`,
        '',
        'TheDigiHubs Support',
      ].filter(Boolean).join('\n'),
    });

    return reviewedRequest;
  }

  private clean(value?: string) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }
}
