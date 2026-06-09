import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleKey } from '@prisma/client';
import { AUTH_PLAN_FEATURES_KEY } from './auth.decorators';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(AUTH_PLAN_FEATURES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeatures?.length) return true;

    const request = context.switchToHttp().getRequest();
    if (request.auth?.role === RoleKey.PLATFORM_ADMIN) return true;

    const features = new Set<string>(request.auth?.features || []);
    const allowed = requiredFeatures.every((feature) => features.has(feature));
    if (!allowed) {
      throw new ForbiddenException('Membership plan does not include this feature');
    }
    return true;
  }
}
