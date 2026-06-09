import type { OrganizationStatus, OrganizationType, PlanKey, RoleKey } from '@prisma/client';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type SessionOrganization = {
  id: string;
  name: string;
  type: OrganizationType;
  status: OrganizationStatus;
  plan?: PlanKey;
};

export type SessionMembership = {
  id: string;
  organization: SessionOrganization;
  role: RoleKey;
  status: string;
  isDefault: boolean;
};

export type TenantContext = {
  sessionId: string;
  user: SessionUser;
  activeOrganization: SessionOrganization;
  memberships: SessionMembership[];
  role: RoleKey;
  permissions: string[];
  plan?: PlanKey;
  features: string[];
};

export type AuthenticatedRequest = {
  auth?: TenantContext;
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
};
