import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { CurrentTenant, Permissions, Roles } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RoleGuard } from '../auth/role.guard';
import { TenantGuard } from '../auth/tenant.guard';
import type { TenantContext } from '../auth/auth.types';
import { MatchingService } from './matching.service';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Post('rfqs/:rfqId/run')
  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard)
  @Roles(RoleKey.BUYER_OWNER, RoleKey.BUYER_MANAGER)
  @Permissions('rfqs.create')
  run(@Param('rfqId') rfqId: string, @CurrentTenant() tenant: TenantContext) {
    return this.matching.matchSuppliersForRfq(rfqId, tenant);
  }
}
