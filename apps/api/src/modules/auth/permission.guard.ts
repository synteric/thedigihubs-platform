import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleKey } from '@prisma/client';
import { AUTH_PERMISSIONS_KEY } from './auth.decorators';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const permissions = this.reflector.getAllAndOverride<string[]>(AUTH_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    if (request.auth?.role === RoleKey.PLATFORM_ADMIN) return true;

    const granted = new Set<string>(request.auth?.permissions || []);
    const allowed = permissions.every((permission) => granted.has(permission));
    if (!allowed) {
      throw new ForbiddenException('Permission does not have access');
    }
    return true;
  }
}
