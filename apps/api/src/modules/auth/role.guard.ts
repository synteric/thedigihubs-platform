import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleKey } from '@prisma/client';
import { AUTH_ROLES_KEY } from './auth.decorators';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<RoleKey[]>(AUTH_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const currentRole = request.auth?.role;
    if (currentRole && (currentRole === RoleKey.PLATFORM_ADMIN || roles.includes(currentRole))) {
      return true;
    }

    throw new ForbiddenException('Role does not have access');
  }
}
