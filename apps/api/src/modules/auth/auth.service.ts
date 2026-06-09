import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipStatus, OrganizationStatus, OrganizationType, PlanKey, Prisma, RoleKey, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from './auth.types';

const SESSION_COOKIE = 'tdh_session';
const REFRESH_COOKIE = 'tdh_refresh';
const SESSION_DAYS = 1;
const REFRESH_DAYS = 14;

type CookieResponse = {
  cookie: (name: string, value: string, options: Record<string, unknown>) => void;
  clearCookie: (name: string, options: Record<string, unknown>) => void;
};

type AuthPlanAssignment = {
  isActive: boolean;
  endsAt: Date | null;
  plan: {
    key: PlanKey;
    features: string[];
  };
};

type AuthMembership = {
  id: string;
  organizationId: string;
  status: MembershipStatus;
  isDefault: boolean;
  organization: {
    id: string;
    name: string;
    type: OrganizationType;
    status: OrganizationStatus;
    planAssignments: AuthPlanAssignment[];
  };
  role: {
    key: RoleKey;
    permissions: Array<{
      permission: {
        key: string;
      };
    }>;
  };
};

type AuthContextUser = {
  id: string;
  name: string;
  email: string;
  memberships: AuthMembership[];
};

type RegisterInput = {
  registrationType: 'buyer' | 'supplier';
  email: string;
  password: string;
  name: string;
  organizationName: string;
  country?: string;
  category?: string;
  countriesServed?: string;
  phone?: string;
  website?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  async login(input: { email: string; password: string }, response: CookieResponse, request: { headers?: Record<string, string | string[] | undefined>; ip?: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: this.userContextInclude(),
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const defaultMembership = this.pickMembership(user.memberships);
    if (!defaultMembership) {
      throw new UnauthorizedException('No active organization membership found');
    }

    const sessionTokens = this.createTokenPair();
    const expiresAt = this.daysFromNow(SESSION_DAYS);
    const refreshExpiresAt = this.daysFromNow(REFRESH_DAYS);

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        activeOrganizationId: defaultMembership.organizationId,
        tokenHash: this.hashToken(sessionTokens.sessionToken),
        refreshTokenHash: this.hashToken(sessionTokens.refreshToken),
        userAgent: this.header(request, 'user-agent'),
        ipAddress: request.ip,
        expiresAt,
        refreshExpiresAt,
      },
      include: {
        user: { include: this.userContextInclude() },
      },
    });

    this.setAuthCookies(response, sessionTokens.sessionToken, sessionTokens.refreshToken, expiresAt, refreshExpiresAt);

    await this.audit.record({
      actorId: user.id,
      action: 'AUTH_LOGIN',
      entity: 'UserSession',
      entityId: session.id,
      metadata: {
        activeOrganizationId: defaultMembership.organizationId,
      },
      ipAddress: request.ip,
    });

    return this.buildTenantContext(session.id, session.user, defaultMembership.organizationId);
  }

  async register(input: RegisterInput, response: CookieResponse, request: { headers?: Record<string, string | string[] | undefined>; ip?: string }) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const organizationName = input.organizationName.trim();
    const country = input.country?.trim() || undefined;
    const category = input.category?.trim() || undefined;
    const phone = input.phone?.trim() || undefined;
    const website = input.website?.trim() || undefined;
    const registrationType = input.registrationType;
    const organizationType = registrationType === 'supplier' ? OrganizationType.SUPPLIER : OrganizationType.BUYER;
    const roleKey = registrationType === 'supplier' ? RoleKey.SUPPLIER_OWNER : RoleKey.BUYER_OWNER;

    if (!name || !organizationName) {
      throw new BadRequestException('Name and organization are required');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      throw new BadRequestException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const created = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { key: roleKey } });
      const plan = await tx.membershipPlan.findUnique({ where: { key: PlanKey.STARTER } });

      if (!role || !plan) {
        throw new BadRequestException('Registration is not configured yet');
      }

      const slug = await this.uniqueOrganizationSlug(tx, organizationName);
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          type: organizationType,
          status: OrganizationStatus.ACTIVE,
          country,
          website,
          description: registrationType === 'supplier'
            ? `${organizationName} supplier workspace on TheDigiHubs.`
            : `${organizationName} buyer workspace on TheDigiHubs.`,
        },
      });

      await tx.organizationPlanAssignment.create({
        data: {
          organizationId: organization.id,
          planId: plan.id,
          isActive: true,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          status: UserStatus.ACTIVE,
          role: roleKey,
          organizationId: organization.id,
        },
      });

      await tx.organizationMembership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          roleId: role.id,
          status: MembershipStatus.ACTIVE,
          isDefault: true,
        },
      });

      if (registrationType === 'supplier') {
        const countriesServed = this.splitList(input.countriesServed || country || '');
        const categories = category ? [category] : [];
        await tx.supplierProfile.create({
          data: {
            organizationId: organization.id,
            countriesServed,
            categories,
            keywords: this.supplierKeywords(organizationName, category),
          },
        });
      }

      return {
        userId: user.id,
        organizationId: organization.id,
      };
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: created.userId },
      include: this.userContextInclude(),
    });

    const sessionTokens = this.createTokenPair();
    const expiresAt = this.daysFromNow(SESSION_DAYS);
    const refreshExpiresAt = this.daysFromNow(REFRESH_DAYS);

    const session = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        activeOrganizationId: created.organizationId,
        tokenHash: this.hashToken(sessionTokens.sessionToken),
        refreshTokenHash: this.hashToken(sessionTokens.refreshToken),
        userAgent: this.header(request, 'user-agent'),
        ipAddress: request.ip,
        expiresAt,
        refreshExpiresAt,
      },
      include: {
        user: { include: this.userContextInclude() },
      },
    });

    this.setAuthCookies(response, sessionTokens.sessionToken, sessionTokens.refreshToken, expiresAt, refreshExpiresAt);

    await this.audit.record({
      actorId: user.id,
      action: 'AUTH_REGISTER',
      entity: 'Organization',
      entityId: created.organizationId,
      metadata: {
        registrationType,
        roleKey,
        category,
        phone,
        website,
      },
      ipAddress: request.ip,
    });

    await this.notifications.sendToSupport({
      subject: `TheDigiHubs registration: ${organizationName} (${registrationType})`,
      replyTo: email,
      text: [
        `A new ${registrationType} account was registered on TheDigiHubs.`,
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Organization: ${organizationName}`,
        `Workspace type: ${organizationType}`,
        `Role: ${roleKey}`,
        country ? `Country: ${country}` : null,
        category ? `Category: ${category}` : null,
        phone ? `Phone: ${phone}` : null,
        website ? `Website: ${website}` : null,
      ].filter(Boolean).join('\n'),
    });

    return this.buildTenantContext(session.id, session.user, created.organizationId);
  }

  async me(context: TenantContext) {
    return this.publicSession(context);
  }

  async logout(context: TenantContext | undefined, response: CookieResponse, request: { ip?: string }) {
    if (context?.sessionId) {
      await this.prisma.userSession.updateMany({
        where: { id: context.sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await this.audit.record({
        actorId: context.user.id,
        action: 'AUTH_LOGOUT',
        entity: 'UserSession',
        entityId: context.sessionId,
        metadata: {
          activeOrganizationId: context.activeOrganization.id,
        },
        ipAddress: request.ip,
      });
    }

    this.clearAuthCookies(response);
    return { ok: true };
  }

  async refresh(request: { headers?: Record<string, string | string[] | undefined>; ip?: string }, response: CookieResponse) {
    const refreshToken = this.readCookie(request, REFRESH_COOKIE);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const refreshTokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.userSession.findUnique({
      where: { refreshTokenHash },
      include: {
        user: { include: this.userContextInclude() },
      },
    });

    if (!session || session.revokedAt || session.refreshExpiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh session expired');
    }

    const sessionTokens = this.createTokenPair();
    const expiresAt = this.daysFromNow(SESSION_DAYS);
    const refreshExpiresAt = this.daysFromNow(REFRESH_DAYS);

    const updated = await this.prisma.userSession.update({
      where: { id: session.id },
      data: {
        tokenHash: this.hashToken(sessionTokens.sessionToken),
        refreshTokenHash: this.hashToken(sessionTokens.refreshToken),
        expiresAt,
        refreshExpiresAt,
      },
      include: {
        user: { include: this.userContextInclude() },
      },
    });

    this.setAuthCookies(response, sessionTokens.sessionToken, sessionTokens.refreshToken, expiresAt, refreshExpiresAt);
    return this.publicSession(this.buildTenantContext(updated.id, updated.user, updated.activeOrganizationId));
  }

  async switchOrganization(context: TenantContext, organizationId: string) {
    const membership = context.memberships.find((item) => item.organization.id === organizationId);
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new BadRequestException('User is not an active member of this organization');
    }

    const updated = await this.prisma.userSession.update({
      where: { id: context.sessionId },
      data: { activeOrganizationId: organizationId },
      include: {
        user: { include: this.userContextInclude() },
      },
    });

    await this.audit.record({
      actorId: context.user.id,
      action: 'AUTH_SWITCH_ORGANIZATION',
      entity: 'Organization',
      entityId: organizationId,
      metadata: {
        previousOrganizationId: context.activeOrganization.id,
      },
    });

    return this.publicSession(this.buildTenantContext(updated.id, updated.user, organizationId));
  }

  async validateRequest(request: { headers?: Record<string, string | string[] | undefined> }) {
    const token = this.readBearerToken(request) || this.readCookie(request, SESSION_COOKIE);
    if (!token) return null;

    const tokenHash = this.hashToken(token);
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      include: {
        user: { include: this.userContextInclude() },
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return this.buildTenantContext(session.id, session.user, session.activeOrganizationId);
  }

  publicSession(context: TenantContext) {
    return {
      user: context.user,
      activeOrganization: context.activeOrganization,
      memberships: context.memberships,
      role: context.role,
      permissions: context.permissions,
      plan: context.plan,
      features: context.features,
    };
  }

  private buildTenantContext(sessionId: string, user: AuthContextUser, activeOrganizationId?: string | null): TenantContext {
    const activeMemberships = user.memberships.filter((membership) => membership.status === MembershipStatus.ACTIVE && membership.organization.status === 'ACTIVE');
    const membership = activeMemberships.find((item) => item.organizationId === activeOrganizationId) || this.pickMembership(activeMemberships);

    if (!membership) {
      throw new UnauthorizedException('No active organization membership found');
    }

    const planAssignment = membership.organization.planAssignments.find((assignment) => assignment.isActive && (!assignment.endsAt || assignment.endsAt > new Date()));
    const permissions = membership.role.permissions.map((rolePermission) => rolePermission.permission.key);
    const plan = planAssignment?.plan.key;
    const features = planAssignment?.plan.features || [];

    return {
      sessionId,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      activeOrganization: {
        id: membership.organization.id,
        name: membership.organization.name,
        type: membership.organization.type,
        status: membership.organization.status,
        plan,
      },
      memberships: activeMemberships.map((item) => {
        const itemPlan = item.organization.planAssignments.find((assignment) => assignment.isActive && (!assignment.endsAt || assignment.endsAt > new Date()))?.plan.key;
        return {
          id: item.id,
          organization: {
            id: item.organization.id,
            name: item.organization.name,
            type: item.organization.type,
            status: item.organization.status,
            plan: itemPlan,
          },
          role: item.role.key,
          status: item.status,
          isDefault: item.isDefault,
        };
      }),
      role: membership.role.key,
      permissions,
      plan,
      features,
    };
  }

  private pickMembership<T extends { isDefault: boolean; organization: { type: OrganizationType }; status: MembershipStatus }>(memberships: T[]) {
    return memberships.find((membership) => membership.isDefault && membership.status === MembershipStatus.ACTIVE)
      || memberships.find((membership) => membership.status === MembershipStatus.ACTIVE && membership.organization.type !== OrganizationType.PLATFORM)
      || memberships.find((membership) => membership.status === MembershipStatus.ACTIVE);
  }

  private userContextInclude() {
    return {
      memberships: {
        include: {
          organization: {
            include: {
              planAssignments: {
                include: { plan: true },
              },
            },
          },
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    } satisfies Prisma.UserInclude;
  }

  private async uniqueOrganizationSlug(tx: Prisma.TransactionClient, name: string) {
    const base = this.slugify(name);
    let slug = base;
    let suffix = 2;

    while (await tx.organization.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${base}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug || `organization-${randomBytes(4).toString('hex')}`;
  }

  private splitList(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private supplierKeywords(organizationName: string, category?: string) {
    return Array.from(new Set([
      ...organizationName.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2),
      ...(category ? category.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 2) : []),
    ]));
  }

  private createTokenPair() {
    return {
      sessionToken: randomBytes(48).toString('base64url'),
      refreshToken: randomBytes(64).toString('base64url'),
    };
  }

  private hashToken(token: string) {
    const pepper = this.config.get<string>('AUTH_SECRET') || 'dev-auth-secret-change-me';
    return createHash('sha256').update(`${pepper}:${token}`).digest('hex');
  }

  private daysFromNow(days: number) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private setAuthCookies(response: CookieResponse, sessionToken: string, refreshToken: string, expiresAt: Date, refreshExpiresAt: Date) {
    const options = this.cookieOptions();
    response.cookie(SESSION_COOKIE, sessionToken, { ...options, expires: expiresAt });
    response.cookie(REFRESH_COOKIE, refreshToken, { ...options, expires: refreshExpiresAt });
  }

  private clearAuthCookies(response: CookieResponse) {
    const options = this.cookieOptions();
    response.clearCookie(SESSION_COOKIE, options);
    response.clearCookie(REFRESH_COOKIE, options);
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
    };
  }

  private readBearerToken(request: { headers?: Record<string, string | string[] | undefined> }) {
    const authorization = this.header(request, 'authorization');
    if (!authorization?.toLowerCase().startsWith('bearer ')) return null;
    return authorization.slice(7).trim();
  }

  private readCookie(request: { headers?: Record<string, string | string[] | undefined> }, name: string) {
    const cookieHeader = this.header(request, 'cookie');
    if (!cookieHeader) return null;

    return cookieHeader
      .split(';')
      .map((part) => part.trim())
      .map((part) => {
        const [key, ...valueParts] = part.split('=');
        return [key, valueParts.join('=')] as const;
      })
      .find(([key]) => key === name)?.[1] || null;
  }

  private header(request: { headers?: Record<string, string | string[] | undefined> }, name: string) {
    const value = request.headers?.[name] || request.headers?.[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }
}
