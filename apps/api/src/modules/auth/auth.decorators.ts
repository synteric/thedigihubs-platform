import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { PlanKey, RoleKey } from '@prisma/client';
import type { TenantContext } from './auth.types';

export const AUTH_ROLES_KEY = 'auth:roles';
export const AUTH_PERMISSIONS_KEY = 'auth:permissions';
export const AUTH_PLAN_FEATURES_KEY = 'auth:plan-features';

export const Roles = (...roles: RoleKey[]) => SetMetadata(AUTH_ROLES_KEY, roles);
export const Permissions = (...permissions: string[]) => SetMetadata(AUTH_PERMISSIONS_KEY, permissions);
export const PlanFeatures = (...features: string[]) => SetMetadata(AUTH_PLAN_FEATURES_KEY, features);

export const CurrentTenant = createParamDecorator((_: unknown, context: ExecutionContext): TenantContext | undefined => {
  const request = context.switchToHttp().getRequest<{ auth?: TenantContext }>();
  return request.auth;
});

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ auth?: TenantContext }>();
  return request.auth?.user;
});

export type RequiredPlan = PlanKey;
