import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  OrganizationStatus,
  OrganizationType,
  PlanKey,
  RfqStatus,
  RoleKey,
  SupportTicketPriority,
  SupportTicketStatus,
  UserStatus,
} from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrentTenant, Roles } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import type { TenantContext } from '../auth/auth.types';
import { RoleGuard } from '../auth/role.guard';
import { AdminService } from './admin.service';

class OrganizationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(OrganizationType)
  type?: OrganizationType;

  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;

  @IsOptional()
  @IsEnum(PlanKey)
  plan?: PlanKey;
}

class UpdateOrganizationStatusDto {
  @IsEnum(OrganizationStatus)
  status!: OrganizationStatus;
}

class AssignOrganizationPlanDto {
  @IsEnum(PlanKey)
  planKey!: PlanKey;
}

class UpdateMembershipPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}

class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsEnum(RoleKey)
  role?: RoleKey;

  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType;
}

class UpdateUserStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

class UpdateMembershipRoleDto {
  @IsString()
  membershipId!: string;

  @IsEnum(RoleKey)
  roleKey!: RoleKey;
}

class RfqQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(RfqStatus)
  status?: RfqStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

class SupportTicketQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsString()
  assigned?: string;
}

class UpdateSupportTicketDto {
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  status?: SupportTicketStatus;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  resolutionNote?: string;
}

class UpdateRfqStatusDto {
  @IsEnum(RfqStatus)
  status!: RfqStatus;
}

class FlagRfqDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class AuditQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

@Controller('admin')
@UseGuards(AuthGuard, RoleGuard)
@Roles(RoleKey.PLATFORM_ADMIN, RoleKey.PLATFORM_SUPPORT)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('revenue')
  revenue() {
    return this.admin.revenue();
  }

  @Get('membership-plans')
  membershipPlans() {
    return this.admin.membershipPlans();
  }

  @Patch('membership-plans/:id')
  updateMembershipPlan(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipPlanDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.updateMembershipPlan(id, dto, tenant);
  }

  @Get('roles')
  rolesAndPermissions() {
    return this.admin.rolesAndPermissions();
  }

  @Get('organizations')
  organizations(@Query() query: OrganizationQueryDto) {
    return this.admin.organizations(query);
  }

  @Patch('organizations/:id/status')
  updateOrganizationStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationStatusDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.updateOrganizationStatus(id, dto.status, tenant);
  }

  @Patch('organizations/:id/plan')
  assignOrganizationPlan(
    @Param('id') id: string,
    @Body() dto: AssignOrganizationPlanDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.assignOrganizationPlan(id, dto.planKey, tenant);
  }

  @Get('users')
  users(@Query() query: UserQueryDto) {
    return this.admin.users(query);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.updateUserStatus(id, dto.status, tenant);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateMembershipRoleDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.updateUserRole(id, dto.membershipId, dto.roleKey, tenant);
  }

  @Get('rfqs')
  rfqs(@Query() query: RfqQueryDto) {
    return this.admin.rfqs(query);
  }

  @Patch('rfqs/:id/status')
  updateRfqStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRfqStatusDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.updateRfqStatus(id, dto.status, tenant);
  }

  @Patch('rfqs/:id/flag')
  flagRfq(
    @Param('id') id: string,
    @Body() dto: FlagRfqDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.flagRfq(id, dto.reason, tenant);
  }

  @Get('support')
  supportTickets(@Query() query: SupportTicketQueryDto) {
    return this.admin.supportTickets(query);
  }

  @Patch('support/:id')
  updateSupportTicket(
    @Param('id') id: string,
    @Body() dto: UpdateSupportTicketDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.admin.updateSupportTicket(id, dto, tenant);
  }

  @Get('audit')
  audit(@Query() query: AuditQueryDto) {
    return this.admin.auditLogs(query);
  }
}
