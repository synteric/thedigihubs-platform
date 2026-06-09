import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const activeOrganization = request.auth?.activeOrganization;
    if (!activeOrganization) {
      throw new ForbiddenException('Active organization required');
    }
    if (activeOrganization.status !== 'ACTIVE') {
      throw new ForbiddenException('Active organization is not available');
    }
    return true;
  }
}
