import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  MembershipStatus,
  OrganizationStatus,
  PlanKey,
  Prisma,
  QuoteStatus,
  RoleKey,
  RfqStatus,
  SubscriptionRequestStatus,
  SupportTicketPriority,
  SupportTicketStatus,
  SupplierVerificationStatus,
  UserStatus,
  OrganizationType,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import type { TenantContext } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

const planOrder = [PlanKey.STARTER, PlanKey.GROWTH, PlanKey.PROFESSIONAL, PlanKey.ENTERPRISE];

const roleOrder = [
  RoleKey.PLATFORM_ADMIN,
  RoleKey.PLATFORM_SUPPORT,
  RoleKey.BUYER_OWNER,
  RoleKey.BUYER_MANAGER,
  RoleKey.BUYER_EVALUATOR,
  RoleKey.SUPPLIER_OWNER,
  RoleKey.SUPPLIER_MANAGER,
  RoleKey.SUPPLIER_STAFF,
  RoleKey.VIEWER,
];

const activeRfqStatuses = [RfqStatus.PUBLISHED, RfqStatus.QUOTATION_OPEN, RfqStatus.EVALUATION];

function startOfRecentWindow() {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

function formatRole(label: string) {
  return label
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatStatus(label: string) {
  return label
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function planLabel(plan?: PlanKey) {
  return plan ? formatStatus(plan) : 'No plan';
}

type OrganizationQuery = {
  search?: string;
  type?: OrganizationType;
  status?: OrganizationStatus;
  plan?: PlanKey;
};

type UserQuery = {
  search?: string;
  status?: UserStatus;
  role?: RoleKey;
  organizationType?: OrganizationType;
};

type RfqQuery = {
  search?: string;
  status?: RfqStatus;
  category?: string;
  country?: string;
};

type SupportTicketQuery = {
  search?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assigned?: string;
};

type AuditQuery = {
  search?: string;
  entity?: string;
  action?: string;
  actor?: string;
  from?: string;
  to?: string;
};

type UpdateMembershipPlanInput = {
  name?: string;
  description?: string;
  features?: string[];
};

type UpdateSupportTicketInput = {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assignedToId?: string;
  resolutionNote?: string;
};

type PlanRequestStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type AdminOrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  type: OrganizationType;
  status: OrganizationStatus;
  country: string | null;
  website: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    memberships: number;
    buyerRfqs: number;
    sessions: number;
  };
  planAssignments: Array<{
    startsAt: Date;
    endsAt: Date | null;
    plan: {
      key: PlanKey;
      name: string;
      features: string[];
    };
  }>;
};

type AdminMembershipPlanRecord = {
  id: string;
  key: PlanKey;
  name: string;
  description: string | null;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
  assignments: Array<{
    id: string;
    organization: {
      id: string;
      name: string;
      type: OrganizationType;
      status: OrganizationStatus;
    };
  }>;
  _count: {
    assignments: number;
  };
};

type AdminRoleRecord = {
  id: string;
  key: RoleKey;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    memberships: number;
  };
  permissions: Array<{
    permission: {
      id: string;
      key: string;
      description: string | null;
    };
  }>;
};

type AdminPermissionRecord = {
  id: string;
  key: string;
  description: string | null;
  roles: Array<{
    role: {
      id: string;
      key: RoleKey;
      name: string;
    };
  }>;
};

type AdminUserRecord = {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  role: RoleKey;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    sessions: number;
    createdRfqs: number;
  };
  memberships: Array<{
    id: string;
    organizationId: string;
    status: MembershipStatus;
    isDefault: boolean;
    createdAt: Date;
    role: {
      id: string;
      key: RoleKey;
      name: string;
      permissions: Array<{
        permission: {
          key: string;
        };
      }>;
    };
    organization: {
      id: string;
      name: string;
      type: OrganizationType;
      status: OrganizationStatus;
      planAssignments: Array<{
        startsAt: Date;
        endsAt: Date | null;
        plan: {
          key: PlanKey;
          name: string;
          features: string[];
        };
      }>;
    };
  }>;
};

type AdminRfqRecord = {
  id: string;
  reference: string;
  title: string;
  description: string;
  category: string;
  country: string;
  deliveryLocation: string | null;
  currency: string;
  estimatedBudget: Prisma.Decimal | null;
  closingDate: Date;
  status: RfqStatus;
  createdAt: Date;
  updatedAt: Date;
  buyerOrganization: {
    id: string;
    name: string;
    type: OrganizationType;
    status: OrganizationStatus;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    lineItems: number;
    invites: number;
    quotes: number;
    matches: number;
    auditLogs: number;
  };
  award: null | {
    id: string;
    awardedAt: Date;
    decisionNote: string;
    quote: {
      id: string;
      totalAmount: Prisma.Decimal;
      currency: string;
      supplierProfile: null | {
        organization: {
          id: string;
          name: string;
        };
      };
      externalEmail: string | null;
    };
  };
  auditLogs: Array<{
    id: string;
    action: string;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    actor: null | {
      name: string;
      email: string;
    };
  }>;
};

type AdminSupportTicketRecord = {
  id: string;
  reference: string;
  subject: string;
  description: string;
  category: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  requesterName: string | null;
  requesterEmail: string | null;
  resolutionNote: string | null;
  lastResponseAt: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organization: null | {
    id: string;
    name: string;
    type: OrganizationType;
    status: OrganizationStatus;
  };
  createdBy: null | {
    id: string;
    name: string;
    email: string;
  };
  assignedTo: null | {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy: null | {
    id: string;
    name: string;
    email: string;
  };
};

type AdminAuditRecord = {
  id: string;
  actorId: string | null;
  rfqId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Prisma.JsonValue | null;
  ipAddress: string | null;
  createdAt: Date;
  actor: null | {
    id: string;
    name: string;
    email: string;
  };
  rfq: null | {
    id: string;
    reference: string;
    title: string;
    status: RfqStatus;
    buyerOrganization: {
      id: string;
      name: string;
    };
  };
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async overview() {
    const now = new Date();
    const recentWindow = startOfRecentWindow();

    const [
      totalOrganizations,
      recentOrganizationsCount,
      activeUsers,
      recentUsers,
      activeRfqs,
      recentRfqs,
      submittedQuotes,
      pendingReviews,
      activeSessions,
      pendingSupplierVerifications,
      recentOrganizations,
      membershipPlans,
      roleGroups,
      roles,
      rfqGroups,
      subscriptionGroups,
      supportGroups,
      urgentSupportTickets,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.organization.count({ where: { createdAt: { gte: recentWindow } } }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE, createdAt: { gte: recentWindow } } }),
      this.prisma.rfq.count({ where: { status: { in: activeRfqStatuses } } }),
      this.prisma.rfq.count({ where: { createdAt: { gte: recentWindow } } }),
      this.prisma.quote.count({ where: { status: QuoteStatus.SUBMITTED } }),
      this.prisma.subscriptionRequest.count({ where: { status: SubscriptionRequestStatus.PENDING_REVIEW } }),
      this.prisma.userSession.count({ where: { revokedAt: null, expiresAt: { gt: now } } }),
      this.prisma.supplierProfile.count({ where: { verificationStatus: SupplierVerificationStatus.UNVERIFIED } }),
      this.prisma.organization.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { memberships: true } },
          planAssignments: {
            where: {
              isActive: true,
              OR: [{ endsAt: null }, { endsAt: { gt: now } }],
            },
            include: { plan: true },
            orderBy: { startsAt: 'desc' },
          },
        },
      }),
      this.prisma.membershipPlan.findMany({
        include: {
          assignments: {
            where: {
              isActive: true,
              OR: [{ endsAt: null }, { endsAt: { gt: now } }],
              organization: { is: { status: OrganizationStatus.ACTIVE } },
            },
            select: { id: true },
          },
        },
      }),
      this.prisma.organizationMembership.groupBy({
        by: ['roleId'],
        where: { status: MembershipStatus.ACTIVE },
        _count: { _all: true },
      }),
      this.prisma.role.findMany({ select: { id: true, key: true, name: true } }),
      this.prisma.rfq.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.subscriptionRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.supportTicket.count({
        where: {
          priority: SupportTicketPriority.URGENT,
          status: {
            in: [SupportTicketStatus.OPEN, SupportTicketStatus.IN_PROGRESS, SupportTicketStatus.WAITING_ON_CUSTOMER],
          },
        },
      }),
      this.prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { name: true } } },
      }),
    ]);

    const totalActivePlans = membershipPlans.reduce((sum, plan) => sum + plan.assignments.length, 0);
    const planDistribution = planOrder.map((key) => {
      const plan = membershipPlans.find((item) => item.key === key);
      const count = plan?.assignments.length || 0;
      const percent = totalActivePlans ? Math.round((count / totalActivePlans) * 100) : 0;
      return {
        key,
        label: planLabel(key),
        count,
        percent,
      };
    });

    const roleMap = new Map(roles.map((role) => [role.id, role]));
    const roleSummary = roleGroups
      .map((group) => {
        const role = roleMap.get(group.roleId);
        return {
          label: role?.name || formatRole(role?.key || 'VIEWER'),
          count: group._count._all,
        };
      })
      .sort((a, b) => b.count - a.count);

    const rfqStatusMap = new Map(rfqGroups.map((group) => [group.status, group._count._all]));
    const subscriptionStatusMap = new Map(subscriptionGroups.map((group) => [group.status, group._count._all]));
    const supportStatusMap = new Map(supportGroups.map((group) => [group.status, group._count._all]));
    const approvedSubscriptionRequests = subscriptionStatusMap.get(SubscriptionRequestStatus.APPROVED) || 0;
    const openSupportTickets = supportStatusMap.get(SupportTicketStatus.OPEN) || 0;
    const activeSupportTickets = openSupportTickets
      + (supportStatusMap.get(SupportTicketStatus.IN_PROGRESS) || 0)
      + (supportStatusMap.get(SupportTicketStatus.WAITING_ON_CUSTOMER) || 0);

    return {
      generatedAt: now.toISOString(),
      kpis: {
        totalOrganizations: {
          value: totalOrganizations,
          change: `${recentOrganizationsCount} new in last 7 days`,
        },
        activeUsers: {
          value: activeUsers,
          change: `${recentUsers} new in last 7 days`,
        },
        activeRfqs: {
          value: activeRfqs,
          change: `${recentRfqs} created in last 7 days`,
        },
        subscriptionReviews: {
          value: pendingReviews,
          change: 'pending admin review',
        },
      },
      recentOrganizations: recentOrganizations.map((organization) => {
        const assignment = organization.planAssignments[0];
        return {
          id: organization.id,
          name: organization.name,
          website: organization.website,
          type: organization.type,
          status: organization.status,
          plan: assignment?.plan.key || null,
          users: organization._count.memberships,
        };
      }),
      planDistribution: {
        total: totalActivePlans,
        items: planDistribution,
      },
      roleSummary: {
        total: roleSummary.reduce((sum, item) => sum + item.count, 0),
        items: roleSummary,
      },
      supportQueue: [
        { label: 'Open support tickets', count: openSupportTickets, priority: openSupportTickets > 0 ? 'Review' : 'Clear' },
        { label: 'Urgent support tickets', count: urgentSupportTickets, priority: urgentSupportTickets > 0 ? 'Act now' : 'Clear' },
        { label: 'Plan reviews', count: pendingReviews, priority: pendingReviews > 0 ? 'Action needed' : 'Clear' },
        { label: 'Supplier verifications', count: pendingSupplierVerifications, priority: pendingSupplierVerifications > 0 ? 'Review' : 'Clear' },
      ],
      rfqQueue: [
        { label: 'Draft RFQs', count: rfqStatusMap.get(RfqStatus.DRAFT) || 0, action: 'Review' },
        { label: 'Published RFQs', count: rfqStatusMap.get(RfqStatus.PUBLISHED) || 0, action: 'View' },
        { label: 'In evaluation', count: rfqStatusMap.get(RfqStatus.EVALUATION) || 0, action: 'View' },
        { label: 'Awarded RFQs', count: rfqStatusMap.get(RfqStatus.AWARDED) || 0, action: 'View' },
      ],
      subscriptionInsights: {
        billingStatus: 'Billing data not connected',
        items: [
          { label: 'Approved plan requests', value: approvedSubscriptionRequests },
          { label: 'Pending reviews', value: pendingReviews },
          { label: 'Active plan assignments', value: totalActivePlans },
          { label: 'Submitted quotes', value: submittedQuotes },
        ],
      },
      auditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        message: `${log.actor?.name || 'System'} ${this.auditLabel(log.action)} ${this.auditLabel(log.entity)}`,
        date: log.createdAt.toISOString(),
      })),
      operationsSnapshot: [
        { label: 'Pending verifications', value: pendingSupplierVerifications },
        { label: 'Active plans', value: totalActivePlans },
        { label: 'Upgrade reviews', value: pendingReviews },
        { label: 'Active support tickets', value: activeSupportTickets },
        { label: 'Active sessions', value: activeSessions },
        { label: 'RFQs active', value: activeRfqs },
      ],
      systemHealth: {
        status: 'Operational',
        database: 'Connected',
        activeSessions,
        services: ['API', 'Database', 'Auth', 'Admin'],
      },
    };
  }

  async revenue() {
    const now = new Date();
    const activeAssignmentWhere: Prisma.OrganizationPlanAssignmentWhereInput = {
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      organization: { is: { status: OrganizationStatus.ACTIVE } },
    };

    const [
      plans,
      requestStats,
      requestGroups,
      recentRequests,
      recentDecisions,
      recentAssignments,
    ] = await Promise.all([
      this.prisma.membershipPlan.findMany({
        include: this.membershipPlanInclude(now),
      }),
      this.membershipPlanRequestStats(),
      this.prisma.subscriptionRequest.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.subscriptionRequest.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          selectedPlan: true,
          status: true,
          name: true,
          email: true,
          organizationName: true,
          organizationType: true,
          country: true,
          category: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.subscriptionRequest.findMany({
        where: { status: { in: [SubscriptionRequestStatus.APPROVED, SubscriptionRequestStatus.REJECTED] } },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          selectedPlan: true,
          status: true,
          name: true,
          email: true,
          organizationName: true,
          decisionNote: true,
          reviewedAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.organizationPlanAssignment.findMany({
        where: activeAssignmentWhere,
        take: 12,
        orderBy: { startsAt: 'desc' },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
            },
          },
          plan: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const sortedPlans = [...plans].sort((a, b) => planOrder.indexOf(a.key) - planOrder.indexOf(b.key));
    const requestStatusMap = new Map(requestGroups.map((group) => [group.status, group._count._all]));
    const totalRequests = requestGroups.reduce((sum, group) => sum + group._count._all, 0);
    const pendingRequests = requestStatusMap.get(SubscriptionRequestStatus.PENDING_REVIEW) || 0;
    const approvedRequests = requestStatusMap.get(SubscriptionRequestStatus.APPROVED) || 0;
    const rejectedRequests = requestStatusMap.get(SubscriptionRequestStatus.REJECTED) || 0;
    const activeAssignments = sortedPlans.reduce((sum, plan) => sum + plan.assignments.length, 0);
    const activeOrganizations = new Set(sortedPlans.flatMap((plan) => plan.assignments.map((assignment) => assignment.organization.id))).size;
    const approvalRate = totalRequests ? Math.round((approvedRequests / totalRequests) * 100) : 0;

    return {
      generatedAt: now.toISOString(),
      billing: {
        connected: false,
        status: 'NOT_CONNECTED',
        label: 'Billing not connected',
        provider: null,
        currency: null,
        message: 'Billing integration is not connected yet. Revenue, invoices, and payment status will appear after a billing provider is connected.',
      },
      summary: {
        configuredPlans: sortedPlans.length,
        activeAssignments,
        activeOrganizations,
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        approvalRate,
      },
      financials: {
        recognizedRevenue: null,
        recurringRevenue: null,
        outstandingInvoices: null,
        note: 'No invoice or payment records exist yet.',
      },
      plans: sortedPlans.map((plan) => {
        const stats = requestStats.get(plan.key) || this.emptyPlanRequestStats();
        return {
          ...this.membershipPlanItem(plan, stats),
          conversionRate: stats.total ? Math.round((stats.approved / stats.total) * 100) : 0,
          percentOfAssignments: activeAssignments ? Math.round((plan.assignments.length / activeAssignments) * 100) : 0,
        };
      }),
      recentRequests: recentRequests.map((request) => ({
        id: request.id,
        selectedPlan: request.selectedPlan,
        status: request.status,
        name: request.name,
        email: request.email,
        organizationName: request.organizationName,
        organizationType: request.organizationType,
        country: request.country,
        category: request.category,
        createdAt: request.createdAt.toISOString(),
        updatedAt: request.updatedAt.toISOString(),
      })),
      recentDecisions: recentDecisions.map((request) => ({
        id: request.id,
        selectedPlan: request.selectedPlan,
        status: request.status,
        name: request.name,
        email: request.email,
        organizationName: request.organizationName,
        decisionNote: request.decisionNote,
        reviewedAt: request.reviewedAt?.toISOString() || null,
        updatedAt: request.updatedAt.toISOString(),
      })),
      recentAssignments: recentAssignments.map((assignment) => ({
        id: assignment.id,
        plan: assignment.plan,
        organization: assignment.organization,
        startsAt: assignment.startsAt.toISOString(),
        endsAt: assignment.endsAt?.toISOString() || null,
      })),
      readiness: [
        { label: 'Plan catalog', status: 'Ready', complete: true },
        { label: 'Subscription request workflow', status: 'Ready', complete: true },
        { label: 'Admin plan assignment', status: 'Ready', complete: true },
        { label: 'Billing provider', status: 'Not connected', complete: false },
        { label: 'Invoice records', status: 'Not built', complete: false },
        { label: 'Payment webhooks', status: 'Not built', complete: false },
        { label: 'Renewal automation', status: 'Not built', complete: false },
      ],
    };
  }

  async membershipPlans() {
    const now = new Date();
    const [plans, requestStats] = await Promise.all([
      this.prisma.membershipPlan.findMany({
        include: this.membershipPlanInclude(now),
      }),
      this.membershipPlanRequestStats(),
    ]);

    const sortedPlans = [...plans].sort((a, b) => planOrder.indexOf(a.key) - planOrder.indexOf(b.key));
    const totalActiveAssignments = sortedPlans.reduce((sum, plan) => sum + plan.assignments.length, 0);
    const totalPendingRequests = [...requestStats.values()].reduce((sum, stats) => sum + stats.pending, 0);

    return {
      summary: {
        totalPlans: sortedPlans.length,
        activeAssignments: totalActiveAssignments,
        pendingRequests: totalPendingRequests,
        configuredFeatures: new Set(sortedPlans.flatMap((plan) => plan.features)).size,
      },
      plans: sortedPlans.map((plan) => this.membershipPlanItem(plan, requestStats.get(plan.key) || this.emptyPlanRequestStats())),
    };
  }

  async updateMembershipPlan(id: string, input: UpdateMembershipPlanInput, tenant: TenantContext) {
    const existing = await this.prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Membership plan not found');
    }

    const data: Prisma.MembershipPlanUpdateInput = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) throw new BadRequestException('Plan name is required');
      data.name = name;
    }
    if (input.description !== undefined) {
      data.description = input.description.trim() || null;
    }
    if (input.features !== undefined) {
      const features = input.features.map((feature) => feature.trim()).filter(Boolean);
      if (!features.length) throw new BadRequestException('At least one feature key is required');
      data.features = [...new Set(features)];
    }
    if (!Object.keys(data).length) {
      throw new BadRequestException('No membership plan changes were provided');
    }

    const updated = await this.prisma.membershipPlan.update({
      where: { id },
      data,
      include: this.membershipPlanInclude(new Date()),
    });

    await this.audit.record({
      actorId: tenant.user.id,
      action: 'ADMIN_MEMBERSHIP_PLAN_UPDATED',
      entity: 'MembershipPlan',
      entityId: id,
      metadata: {
        planKey: existing.key,
        previousName: existing.name,
        name: updated.name,
        previousDescription: existing.description,
        description: updated.description,
        previousFeatures: existing.features,
        features: updated.features,
      },
    });

    const stats = await this.membershipPlanRequestStats();
    return this.membershipPlanItem(updated, stats.get(updated.key) || this.emptyPlanRequestStats());
  }

  async rolesAndPermissions() {
    const [roles, permissions, membershipGroups, legacyRoleGroups] = await Promise.all([
      this.prisma.role.findMany({
        include: {
          _count: {
            select: {
              memberships: true,
            },
          },
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  key: true,
                  description: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.permission.findMany({
        orderBy: { key: 'asc' },
        include: {
          roles: {
            include: {
              role: {
                select: {
                  id: true,
                  key: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.organizationMembership.groupBy({
        by: ['roleId', 'status'],
        _count: { _all: true },
      }),
      this.prisma.user.groupBy({
        by: ['role', 'status'],
        _count: { _all: true },
      }),
    ]);

    const membershipStats = this.roleMembershipStats(membershipGroups);
    const legacyStats = this.legacyRoleStats(legacyRoleGroups);
    const sortedRoles = [...roles].sort((a, b) => roleOrder.indexOf(a.key) - roleOrder.indexOf(b.key));
    const roleItems = sortedRoles.map((role) => this.roleItem(role, membershipStats.get(role.id), legacyStats.get(role.key)));
    const permissionItems = permissions.map((permission) => this.permissionItem(permission));
    const activeMemberships = [...membershipStats.values()].reduce((sum, stats) => sum + stats.active, 0);

    return {
      summary: {
        totalRoles: roleItems.length,
        totalPermissions: permissionItems.length,
        activeMemberships,
        platformRoles: roleItems.filter((role) => role.domain === 'Platform').length,
        buyerRoles: roleItems.filter((role) => role.domain === 'Buyer').length,
        supplierRoles: roleItems.filter((role) => role.domain === 'Supplier').length,
      },
      roles: roleItems,
      permissions: permissionItems,
      matrix: permissionItems.map((permission) => ({
        key: permission.key,
        label: permission.label,
        domain: permission.domain,
        roles: roleItems.map((role) => ({
          key: role.key,
          enabled: role.permissions.some((item) => item.key === permission.key),
        })),
      })),
    };
  }

  async organizations(query: OrganizationQuery) {
    const now = new Date();
    const where = this.organizationWhere(query, now);
    const summaryWhere: Prisma.OrganizationWhereInput = { ...where };
    delete summaryWhere.status;

    const [items, total, active, suspended, pendingVerification] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        take: 50,
        orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
        include: this.organizationInclude(now),
      }),
      this.prisma.organization.count({ where }),
      this.prisma.organization.count({ where: { ...summaryWhere, status: OrganizationStatus.ACTIVE } }),
      this.prisma.organization.count({ where: { ...summaryWhere, status: OrganizationStatus.SUSPENDED } }),
      this.prisma.organization.count({ where: { ...summaryWhere, status: OrganizationStatus.PENDING_VERIFICATION } }),
    ]);

    return {
      total,
      summary: {
        active,
        suspended,
        pendingVerification,
      },
      organizations: items.map((item) => this.organizationItem(item)),
    };
  }

  async updateOrganizationStatus(id: string, status: OrganizationStatus, tenant: TenantContext) {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    if (organization.type === OrganizationType.PLATFORM && status !== OrganizationStatus.ACTIVE) {
      throw new BadRequestException('Platform organizations cannot be suspended from this screen');
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: { status },
      include: this.organizationInclude(new Date()),
    });

    await this.audit.record({
      actorId: tenant.user.id,
      action: 'ADMIN_ORGANIZATION_STATUS_UPDATED',
      entity: 'Organization',
      entityId: id,
      metadata: {
        organizationName: organization.name,
        previousStatus: organization.status,
        status,
      },
    });

    return this.organizationItem(updated);
  }

  async assignOrganizationPlan(id: string, planKey: PlanKey, tenant: TenantContext) {
    const now = new Date();
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: this.organizationInclude(now),
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    const plan = await this.prisma.membershipPlan.findUnique({ where: { key: planKey } });
    if (!plan) {
      throw new BadRequestException('Membership plan is not configured');
    }

    const previousPlan = organization.planAssignments[0]?.plan.key || null;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.organizationPlanAssignment.updateMany({
        where: {
          organizationId: id,
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
            organizationId: id,
            planId: plan.id,
          },
        },
        update: {
          isActive: true,
          startsAt: now,
          endsAt: null,
        },
        create: {
          organizationId: id,
          planId: plan.id,
          isActive: true,
          startsAt: now,
        },
      });

      return tx.organization.findUniqueOrThrow({
        where: { id },
        include: this.organizationInclude(now),
      });
    });

    await this.audit.record({
      actorId: tenant.user.id,
      action: 'ADMIN_ORGANIZATION_PLAN_ASSIGNED',
      entity: 'Organization',
      entityId: id,
      metadata: {
        organizationName: organization.name,
        previousPlan,
        plan: planKey,
      },
    });

    return this.organizationItem(updated);
  }

  async users(query: UserQuery) {
    const now = new Date();
    const where = this.userWhere(query);
    const summaryWhere: Prisma.UserWhereInput = { ...where };
    delete summaryWhere.status;

    const [items, total, active, suspended, invited, roles] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: 50,
        orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
        include: this.userInclude(now),
      }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...summaryWhere, status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { ...summaryWhere, status: UserStatus.SUSPENDED } }),
      this.prisma.user.count({ where: { ...summaryWhere, status: UserStatus.INVITED } }),
      this.prisma.role.findMany({
        orderBy: { name: 'asc' },
        include: {
          permissions: {
            include: {
              permission: {
                select: { key: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      summary: {
        active,
        suspended,
        invited,
      },
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        permissions: role.permissions.map((item) => item.permission.key),
      })),
      users: items.map((item) => this.userItem(item)),
    };
  }

  async updateUserStatus(id: string, status: UserStatus, tenant: TenantContext) {
    if (id === tenant.user.id && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('You cannot suspend your own admin account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude(new Date()),
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (status === UserStatus.SUSPENDED) {
        await tx.userSession.updateMany({
          where: {
            userId: id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }

      return tx.user.update({
        where: { id },
        data: { status },
        include: this.userInclude(new Date()),
      });
    });

    await this.audit.record({
      actorId: tenant.user.id,
      action: 'ADMIN_USER_STATUS_UPDATED',
      entity: 'User',
      entityId: id,
      metadata: {
        userEmail: user.email,
        previousStatus: user.status,
        status,
      },
    });

    return this.userItem(updated);
  }

  async updateUserRole(id: string, membershipId: string, roleKey: RoleKey, tenant: TenantContext) {
    const membership = await this.prisma.organizationMembership.findFirst({
      where: {
        id: membershipId,
        userId: id,
      },
      include: {
        user: true,
        role: true,
        organization: true,
      },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (id === tenant.user.id && roleKey !== RoleKey.PLATFORM_ADMIN) {
      throw new BadRequestException('You cannot remove your own platform admin role');
    }
    if (!this.roleAllowedForOrganization(roleKey, membership.organization.type)) {
      throw new BadRequestException('Selected role does not match this organization type');
    }

    const role = await this.prisma.role.findUnique({ where: { key: roleKey } });
    if (!role) {
      throw new BadRequestException('Role is not configured');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.organizationMembership.update({
        where: { id: membershipId },
        data: { roleId: role.id },
      });

      if (membership.user.organizationId === membership.organizationId) {
        await tx.user.update({
          where: { id },
          data: { role: roleKey },
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: this.userInclude(new Date()),
      });
    });

    await this.audit.record({
      actorId: tenant.user.id,
      action: 'ADMIN_USER_ROLE_UPDATED',
      entity: 'User',
      entityId: id,
      metadata: {
        userEmail: membership.user.email,
        organizationName: membership.organization.name,
        previousRole: membership.role.key,
        role: roleKey,
      },
    });

    return this.userItem(updated);
  }

  async rfqs(query: RfqQuery) {
    const where = this.rfqWhere(query);
    const summaryWhere: Prisma.RfqWhereInput = { ...where };
    delete summaryWhere.status;

    const [items, total, draft, open, evaluation, awarded, cancelled, closed, categories, countries] = await Promise.all([
      this.prisma.rfq.findMany({
        where,
        take: 50,
        orderBy: [{ updatedAt: 'desc' }, { closingDate: 'asc' }],
        include: this.rfqInclude(),
      }),
      this.prisma.rfq.count({ where }),
      this.prisma.rfq.count({ where: { ...summaryWhere, status: RfqStatus.DRAFT } }),
      this.prisma.rfq.count({ where: { ...summaryWhere, status: { in: [RfqStatus.PUBLISHED, RfqStatus.QUOTATION_OPEN] } } }),
      this.prisma.rfq.count({ where: { ...summaryWhere, status: RfqStatus.EVALUATION } }),
      this.prisma.rfq.count({ where: { ...summaryWhere, status: RfqStatus.AWARDED } }),
      this.prisma.rfq.count({ where: { ...summaryWhere, status: RfqStatus.CANCELLED } }),
      this.prisma.rfq.count({ where: { ...summaryWhere, status: RfqStatus.CLOSED } }),
      this.prisma.rfq.findMany({
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
      this.prisma.rfq.findMany({
        distinct: ['country'],
        select: { country: true },
        orderBy: { country: 'asc' },
      }),
    ]);

    return {
      total,
      summary: {
        draft,
        open,
        evaluation,
        awarded,
        cancelled,
        closed,
      },
      filters: {
        categories: categories.map((item) => item.category).filter(Boolean),
        countries: countries.map((item) => item.country).filter(Boolean),
      },
      rfqs: items.map((item) => this.rfqItem(item)),
    };
  }

  async updateRfqStatus(id: string, status: RfqStatus, tenant: TenantContext) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: {
        award: true,
      },
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }
    if (status === RfqStatus.AWARDED && !rfq.award) {
      throw new BadRequestException('RFQ cannot be marked Awarded without an award record');
    }

    const updated = await this.prisma.rfq.update({
      where: { id },
      data: { status },
      include: this.rfqInclude(),
    });

    await this.audit.record({
      actorId: tenant.user.id,
      rfqId: id,
      action: 'ADMIN_RFQ_STATUS_UPDATED',
      entity: 'Rfq',
      entityId: id,
      metadata: {
        reference: rfq.reference,
        title: rfq.title,
        previousStatus: rfq.status,
        status,
      },
    });

    return this.rfqItem(updated);
  }

  async flagRfq(id: string, reason: string | undefined, tenant: TenantContext) {
    const rfq = await this.prisma.rfq.findUnique({
      where: { id },
      include: this.rfqInclude(),
    });
    if (!rfq) {
      throw new NotFoundException('RFQ not found');
    }

    await this.audit.record({
      actorId: tenant.user.id,
      rfqId: id,
      action: 'ADMIN_RFQ_FLAGGED',
      entity: 'Rfq',
      entityId: id,
      metadata: {
        reference: rfq.reference,
        title: rfq.title,
        reason: reason?.trim() || 'Flagged for admin review',
      },
    });

    const updated = await this.prisma.rfq.findUniqueOrThrow({
      where: { id },
      include: this.rfqInclude(),
    });

    return this.rfqItem(updated);
  }

  async supportTickets(query: SupportTicketQuery) {
    const where = this.supportTicketWhere(query);
    const statusWhere: Prisma.SupportTicketWhereInput = { ...where };
    const priorityWhere: Prisma.SupportTicketWhereInput = { ...where };
    delete statusWhere.status;
    delete priorityWhere.priority;

    const [tickets, total, open, inProgress, waiting, resolved, closed, urgent, assignees] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        take: 100,
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        include: this.supportTicketInclude(),
      }),
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.count({ where: { ...statusWhere, status: SupportTicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { ...statusWhere, status: SupportTicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { ...statusWhere, status: SupportTicketStatus.WAITING_ON_CUSTOMER } }),
      this.prisma.supportTicket.count({ where: { ...statusWhere, status: SupportTicketStatus.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { ...statusWhere, status: SupportTicketStatus.CLOSED } }),
      this.prisma.supportTicket.count({ where: { ...priorityWhere, priority: SupportTicketPriority.URGENT } }),
      this.prisma.user.findMany({
        where: this.platformSupportUserWhere(),
        orderBy: [{ name: 'asc' }, { email: 'asc' }],
        select: {
          id: true,
          name: true,
          email: true,
        },
      }),
    ]);

    return {
      total,
      summary: {
        open,
        inProgress,
        waiting,
        resolved,
        closed,
        urgent,
      },
      assignees,
      tickets: tickets.map((ticket) => this.supportTicketItem(ticket)),
    };
  }

  async updateSupportTicket(id: string, input: UpdateSupportTicketInput, tenant: TenantContext) {
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: this.supportTicketInclude(),
    });
    if (!existing) {
      throw new NotFoundException('Support ticket not found');
    }

    const data: Prisma.SupportTicketUpdateInput = {};
    if (input.status !== undefined) {
      data.status = input.status;
      data.resolvedAt = input.status === SupportTicketStatus.RESOLVED || input.status === SupportTicketStatus.CLOSED
        ? existing.resolvedAt || new Date()
        : null;
    }
    if (input.priority !== undefined) {
      data.priority = input.priority;
    }
    if (input.resolutionNote !== undefined) {
      const note = input.resolutionNote.trim();
      data.resolutionNote = note || null;
      if (note) data.lastResponseAt = new Date();
    }
    if (input.assignedToId !== undefined) {
      const assignedToId = input.assignedToId.trim();
      if (!assignedToId || assignedToId === 'UNASSIGNED') {
        data.assignedTo = { disconnect: true };
      } else {
        const assignee = await this.prisma.user.findFirst({
          where: this.platformSupportUserWhere(assignedToId),
          select: { id: true },
        });
        if (!assignee) {
          throw new BadRequestException('Support ticket assignee must be an active platform support user');
        }
        data.assignedTo = { connect: { id: assignedToId } };
      }
    }
    if (!Object.keys(data).length) {
      throw new BadRequestException('No support ticket changes were provided');
    }
    data.reviewedBy = { connect: { id: tenant.user.id } };

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data,
      include: this.supportTicketInclude(),
    });

    await this.audit.record({
      actorId: tenant.user.id,
      action: 'ADMIN_SUPPORT_TICKET_UPDATED',
      entity: 'SupportTicket',
      entityId: id,
      metadata: {
        reference: existing.reference,
        subject: existing.subject,
        previousStatus: existing.status,
        status: updated.status,
        previousPriority: existing.priority,
        priority: updated.priority,
        assignedTo: updated.assignedTo?.email || null,
      },
    });

    return this.supportTicketItem(updated);
  }

  async auditLogs(query: AuditQuery) {
    const where = this.auditWhere(query);
    const recentWindow = startOfRecentWindow();
    const recentWhere = this.auditWhere({ ...query, from: recentWindow.toISOString() });

    const [
      logs,
      total,
      recent,
      adminActions,
      rfqFlags,
      userAccessChanges,
      entities,
      actions,
    ] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: this.auditInclude(),
      }),
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({ where: recentWhere }),
      this.prisma.auditLog.count({ where: { ...where, action: { startsWith: 'ADMIN_' } } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'ADMIN_RFQ_FLAGGED' } }),
      this.prisma.auditLog.count({
        where: {
          ...where,
          action: { in: ['ADMIN_USER_STATUS_UPDATED', 'ADMIN_USER_ROLE_UPDATED'] },
        },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['entity'],
        select: { entity: true },
        orderBy: { entity: 'asc' },
      }),
      this.prisma.auditLog.findMany({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      }),
    ]);

    return {
      total,
      summary: {
        recent,
        adminActions,
        rfqFlags,
        userAccessChanges,
      },
      filters: {
        entities: entities.map((item) => item.entity).filter(Boolean),
        actions: actions.map((item) => item.action).filter(Boolean),
      },
      logs: logs.map((log) => this.auditItem(log)),
    };
  }

  private membershipPlanInclude(now: Date) {
    return {
      _count: {
        select: {
          assignments: true,
        },
      },
      assignments: {
        where: {
          isActive: true,
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          organization: { is: { status: OrganizationStatus.ACTIVE } },
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: { startsAt: 'desc' },
      },
    } satisfies Prisma.MembershipPlanInclude;
  }

  private async membershipPlanRequestStats() {
    const stats = new Map<PlanKey, PlanRequestStats>();
    for (const key of planOrder) {
      stats.set(key, this.emptyPlanRequestStats());
    }

    const groups = await this.prisma.subscriptionRequest.groupBy({
      by: ['selectedPlan', 'status'],
      _count: { _all: true },
    });

    for (const group of groups) {
      const count = group._count._all;
      const current = stats.get(group.selectedPlan) || this.emptyPlanRequestStats();
      current.total += count;
      if (group.status === SubscriptionRequestStatus.PENDING_REVIEW) current.pending += count;
      if (group.status === SubscriptionRequestStatus.APPROVED) current.approved += count;
      if (group.status === SubscriptionRequestStatus.REJECTED) current.rejected += count;
      stats.set(group.selectedPlan, current);
    }

    return stats;
  }

  private emptyPlanRequestStats(): PlanRequestStats {
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }

  private membershipPlanItem(plan: AdminMembershipPlanRecord, requestStats: PlanRequestStats) {
    return {
      id: plan.id,
      key: plan.key,
      name: plan.name,
      description: plan.description,
      features: plan.features,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      activeAssignments: plan.assignments.length,
      totalAssignments: plan._count.assignments,
      requestStats,
      organizations: plan.assignments.slice(0, 6).map((assignment) => ({
        id: assignment.organization.id,
        name: assignment.organization.name,
        type: assignment.organization.type,
        status: assignment.organization.status,
      })),
    };
  }

  private roleMembershipStats(groups: Array<{ roleId: string; status: MembershipStatus; _count: { _all: number } }>) {
    const stats = new Map<string, { active: number; suspended: number; invited: number; total: number }>();
    for (const group of groups) {
      const current = stats.get(group.roleId) || { active: 0, suspended: 0, invited: 0, total: 0 };
      const count = group._count._all;
      current.total += count;
      if (group.status === MembershipStatus.ACTIVE) current.active += count;
      if (group.status === MembershipStatus.SUSPENDED) current.suspended += count;
      if (group.status === MembershipStatus.INVITED) current.invited += count;
      stats.set(group.roleId, current);
    }
    return stats;
  }

  private legacyRoleStats(groups: Array<{ role: RoleKey; status: UserStatus; _count: { _all: number } }>) {
    const stats = new Map<RoleKey, { active: number; suspended: number; invited: number; total: number }>();
    for (const group of groups) {
      const current = stats.get(group.role) || { active: 0, suspended: 0, invited: 0, total: 0 };
      const count = group._count._all;
      current.total += count;
      if (group.status === UserStatus.ACTIVE) current.active += count;
      if (group.status === UserStatus.SUSPENDED) current.suspended += count;
      if (group.status === UserStatus.INVITED) current.invited += count;
      stats.set(group.role, current);
    }
    return stats;
  }

  private roleItem(
    role: AdminRoleRecord,
    membershipStats = { active: 0, suspended: 0, invited: 0, total: 0 },
    legacyStats = { active: 0, suspended: 0, invited: 0, total: 0 },
  ) {
    const permissions = role.permissions
      .map((item) => item.permission)
      .sort((a, b) => a.key.localeCompare(b.key));

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      domain: this.roleDomain(role.key),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      membershipStats,
      legacyUserStats: legacyStats,
      totalMemberships: role._count.memberships,
      permissions: permissions.map((permission) => ({
        id: permission.id,
        key: permission.key,
        label: this.permissionLabel(permission.key),
        description: permission.description,
        domain: this.permissionDomain(permission.key),
      })),
    };
  }

  private permissionItem(permission: AdminPermissionRecord) {
    const roles = permission.roles
      .map((item) => item.role)
      .sort((a, b) => roleOrder.indexOf(a.key) - roleOrder.indexOf(b.key));

    return {
      id: permission.id,
      key: permission.key,
      label: this.permissionLabel(permission.key),
      description: permission.description,
      domain: this.permissionDomain(permission.key),
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        domain: this.roleDomain(role.key),
      })),
    };
  }

  private roleDomain(role: RoleKey) {
    if (role === RoleKey.PLATFORM_ADMIN || role === RoleKey.PLATFORM_SUPPORT) return 'Platform';
    if (role === RoleKey.BUYER_OWNER || role === RoleKey.BUYER_MANAGER || role === RoleKey.BUYER_EVALUATOR) return 'Buyer';
    if (role === RoleKey.SUPPLIER_OWNER || role === RoleKey.SUPPLIER_MANAGER || role === RoleKey.SUPPLIER_STAFF) return 'Supplier';
    return 'General';
  }

  private permissionDomain(permission: string) {
    const [domain] = permission.split('.');
    if (domain === 'rfqs') return 'RFQs';
    if (domain === 'quotes') return 'Quotes';
    return this.auditLabel(domain);
  }

  private permissionLabel(permission: string) {
    return permission
      .split('.')
      .map((part) => this.auditLabel(part))
      .join(' ');
  }

  private auditWhere(query: AuditQuery) {
    const where: Prisma.AuditLogWhereInput = {};
    const search = query.search?.trim();
    const actor = query.actor?.trim();
    const from = this.dateFilterValue(query.from);
    const to = this.dateFilterValue(query.to);

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
        { actor: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { actor: { is: { email: { contains: search, mode: 'insensitive' } } } },
        { rfq: { is: { reference: { contains: search, mode: 'insensitive' } } } },
        { rfq: { is: { title: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (query.entity?.trim()) where.entity = { equals: query.entity.trim(), mode: 'insensitive' };
    if (query.action?.trim()) where.action = { equals: query.action.trim(), mode: 'insensitive' };
    if (actor) {
      where.actor = {
        is: {
          OR: [
            { name: { contains: actor, mode: 'insensitive' } },
            { email: { contains: actor, mode: 'insensitive' } },
          ],
        },
      };
    }
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    return where;
  }

  private supportTicketWhere(query: SupportTicketQuery) {
    const where: Prisma.SupportTicketWhereInput = {};
    const search = query.search?.trim();
    const assigned = query.assigned?.trim();

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { requesterName: { contains: search, mode: 'insensitive' } },
        { requesterEmail: { contains: search, mode: 'insensitive' } },
        { organization: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { assignedTo: { is: { name: { contains: search, mode: 'insensitive' } } } },
        { assignedTo: { is: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (assigned) {
      where.assignedToId = assigned === 'UNASSIGNED' ? null : assigned;
    }

    return where;
  }

  private supportTicketInclude() {
    return {
      organization: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    } satisfies Prisma.SupportTicketInclude;
  }

  private supportTicketItem(ticket: AdminSupportTicketRecord) {
    const ageDays = Math.max(0, Math.floor((Date.now() - ticket.createdAt.getTime()) / 86400000));
    return {
      id: ticket.id,
      reference: ticket.reference,
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      requesterName: ticket.requesterName,
      requesterEmail: ticket.requesterEmail,
      organization: ticket.organization,
      createdBy: ticket.createdBy,
      assignedTo: ticket.assignedTo,
      reviewedBy: ticket.reviewedBy,
      resolutionNote: ticket.resolutionNote,
      lastResponseAt: ticket.lastResponseAt,
      resolvedAt: ticket.resolvedAt,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      ageDays,
    };
  }

  private platformSupportUserWhere(id?: string) {
    return {
      ...(id ? { id } : {}),
      status: UserStatus.ACTIVE,
      memberships: {
        some: {
          status: MembershipStatus.ACTIVE,
          organization: {
            type: OrganizationType.PLATFORM,
          },
          role: {
            key: {
              in: [RoleKey.PLATFORM_ADMIN, RoleKey.PLATFORM_SUPPORT],
            },
          },
        },
      },
    } satisfies Prisma.UserWhereInput;
  }

  private organizationWhere(query: OrganizationQuery, now: Date) {
    const where: Prisma.OrganizationWhereInput = {};
    const search = query.search?.trim();

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        {
          memberships: {
            some: {
              user: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
    }

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.plan) {
      where.planAssignments = {
        some: {
          isActive: true,
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
          plan: { key: query.plan },
        },
      };
    }

    return where;
  }

  private organizationInclude(now: Date) {
    return {
      _count: {
        select: {
          memberships: true,
          buyerRfqs: true,
          sessions: true,
        },
      },
      planAssignments: {
        where: {
          isActive: true,
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
        include: {
          plan: {
            select: {
              key: true,
              name: true,
              features: true,
            },
          },
        },
        orderBy: {
          startsAt: 'desc',
        },
      },
    } satisfies Prisma.OrganizationInclude;
  }

  private organizationItem(organization: AdminOrganizationRecord) {
    const plan = organization.planAssignments[0]?.plan;
    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      type: organization.type,
      status: organization.status,
      country: organization.country,
      website: organization.website,
      description: organization.description,
      plan: plan ? {
        key: plan.key,
        name: plan.name,
        features: plan.features,
      } : null,
      users: organization._count.memberships,
      rfqs: organization._count.buyerRfqs,
      sessions: organization._count.sessions,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }

  private userWhere(query: UserQuery) {
    const where: Prisma.UserWhereInput = {};
    const search = query.search?.trim();
    const membershipFilter: Prisma.OrganizationMembershipWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          memberships: {
            some: {
              organization: {
                name: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.role) {
      membershipFilter.role = { key: query.role };
    }
    if (query.organizationType) {
      membershipFilter.organization = { type: query.organizationType };
    }
    if (Object.keys(membershipFilter).length) {
      where.memberships = { some: membershipFilter };
    }

    return where;
  }

  private userInclude(now: Date) {
    return {
      _count: {
        select: {
          sessions: true,
          createdRfqs: true,
        },
      },
      memberships: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: {
                    select: { key: true },
                  },
                },
              },
            },
          },
          organization: {
            include: {
              planAssignments: {
                where: {
                  isActive: true,
                  OR: [{ endsAt: null }, { endsAt: { gt: now } }],
                },
                include: {
                  plan: {
                    select: {
                      key: true,
                      name: true,
                      features: true,
                    },
                  },
                },
                orderBy: { startsAt: 'desc' },
              },
            },
          },
        },
      },
    } satisfies Prisma.UserInclude;
  }

  private userItem(user: AdminUserRecord) {
    const memberships = [...user.memberships].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    const primaryMembership = memberships[0];
    const plan = primaryMembership?.organization.planAssignments[0]?.plan;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      legacyRole: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      sessions: user._count.sessions,
      createdRfqs: user._count.createdRfqs,
      primaryMembership: primaryMembership ? {
        id: primaryMembership.id,
        status: primaryMembership.status,
        isDefault: primaryMembership.isDefault,
        role: {
          key: primaryMembership.role.key,
          name: primaryMembership.role.name,
          permissions: primaryMembership.role.permissions.map((item) => item.permission.key),
        },
        organization: {
          id: primaryMembership.organization.id,
          name: primaryMembership.organization.name,
          type: primaryMembership.organization.type,
          status: primaryMembership.organization.status,
          plan: plan ? {
            key: plan.key,
            name: plan.name,
            features: plan.features,
          } : null,
        },
      } : null,
      memberships: memberships.map((membership) => {
        const membershipPlan = membership.organization.planAssignments[0]?.plan;
        return {
          id: membership.id,
          status: membership.status,
          isDefault: membership.isDefault,
          role: {
            key: membership.role.key,
            name: membership.role.name,
            permissions: membership.role.permissions.map((item) => item.permission.key),
          },
          organization: {
            id: membership.organization.id,
            name: membership.organization.name,
            type: membership.organization.type,
            status: membership.organization.status,
            plan: membershipPlan ? {
              key: membershipPlan.key,
              name: membershipPlan.name,
              features: membershipPlan.features,
            } : null,
          },
        };
      }),
    };
  }

  private roleAllowedForOrganization(role: RoleKey, organizationType: OrganizationType) {
    if (role === RoleKey.VIEWER) return true;
    if (organizationType === OrganizationType.PLATFORM) {
      return role === RoleKey.PLATFORM_ADMIN || role === RoleKey.PLATFORM_SUPPORT;
    }
    if (organizationType === OrganizationType.BUYER) {
      return role === RoleKey.BUYER_OWNER || role === RoleKey.BUYER_MANAGER || role === RoleKey.BUYER_EVALUATOR;
    }
    return role === RoleKey.SUPPLIER_OWNER || role === RoleKey.SUPPLIER_MANAGER || role === RoleKey.SUPPLIER_STAFF;
  }

  private rfqWhere(query: RfqQuery) {
    const where: Prisma.RfqWhereInput = {};
    const search = query.search?.trim();

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { buyerOrganization: { name: { contains: search, mode: 'insensitive' } } },
        { createdBy: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.category?.trim()) where.category = { equals: query.category.trim(), mode: 'insensitive' };
    if (query.country?.trim()) where.country = { equals: query.country.trim(), mode: 'insensitive' };

    return where;
  }

  private rfqInclude() {
    return {
      buyerOrganization: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          lineItems: true,
          invites: true,
          quotes: true,
          matches: true,
          auditLogs: true,
        },
      },
      award: {
        include: {
          quote: {
            include: {
              supplierProfile: {
                include: {
                  organization: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      auditLogs: {
        where: {
          action: 'ADMIN_RFQ_FLAGGED',
        },
        take: 1,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          actor: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    } satisfies Prisma.RfqInclude;
  }

  private rfqItem(rfq: AdminRfqRecord) {
    const latestFlag = rfq.auditLogs[0];
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
      closingDate: rfq.closingDate,
      status: rfq.status,
      createdAt: rfq.createdAt,
      updatedAt: rfq.updatedAt,
      buyerOrganization: rfq.buyerOrganization,
      createdBy: rfq.createdBy,
      counts: {
        lineItems: rfq._count.lineItems,
        invites: rfq._count.invites,
        quotes: rfq._count.quotes,
        matches: rfq._count.matches,
        auditLogs: rfq._count.auditLogs,
      },
      award: rfq.award ? {
        id: rfq.award.id,
        awardedAt: rfq.award.awardedAt,
        decisionNote: rfq.award.decisionNote,
        supplierName: rfq.award.quote.supplierProfile?.organization.name || rfq.award.quote.externalEmail || 'External supplier',
        totalAmount: rfq.award.quote.totalAmount.toString(),
        currency: rfq.award.quote.currency,
      } : null,
      flag: latestFlag ? {
        id: latestFlag.id,
        createdAt: latestFlag.createdAt,
        actorName: latestFlag.actor?.name || 'Admin',
        reason: this.auditReason(latestFlag.metadata),
      } : null,
    };
  }

  private auditInclude() {
    return {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      rfq: {
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          buyerOrganization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    } satisfies Prisma.AuditLogInclude;
  }

  private auditItem(log: AdminAuditRecord) {
    const actorName = log.actor?.name || 'System';
    return {
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      createdAt: log.createdAt,
      ipAddress: log.ipAddress,
      message: `${actorName} ${this.auditLabel(log.action)} ${this.auditLabel(log.entity)}`,
      actor: log.actor ? {
        id: log.actor.id,
        name: log.actor.name,
        email: log.actor.email,
      } : null,
      rfq: log.rfq ? {
        id: log.rfq.id,
        reference: log.rfq.reference,
        title: log.rfq.title,
        status: log.rfq.status,
        buyerOrganization: log.rfq.buyerOrganization,
      } : null,
      metadata: this.auditMetadata(log.metadata),
    };
  }

  private auditMetadata(metadata: Prisma.JsonValue | null) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return [];
    }

    return Object.entries(metadata)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .slice(0, 8)
      .map(([key, value]) => ({
        key: this.auditLabel(key),
        value: typeof value === 'string' ? value : JSON.stringify(value),
      }));
  }

  private auditLabel(value: string) {
    return formatStatus(value)
      .replace(/\bRfq\b/g, 'RFQ')
      .replace(/\bApi\b/g, 'API');
  }

  private dateFilterValue(value?: string) {
    if (!value?.trim()) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private auditReason(metadata: Prisma.JsonValue | null) {
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata) && 'reason' in metadata) {
      const reason = metadata.reason;
      return typeof reason === 'string' ? reason : 'Flagged for admin review';
    }
    return 'Flagged for admin review';
  }
}
