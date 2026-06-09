import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RoleKey } from '@prisma/client';
import { IsIn, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { CurrentTenant, Permissions, PlanFeatures, Roles } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { PlanGuard } from '../auth/plan.guard';
import { RoleGuard } from '../auth/role.guard';
import { TenantGuard } from '../auth/tenant.guard';
import type { TenantContext } from '../auth/auth.types';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { RfqService } from './rfq.service';

class SupplierQuoteDto {
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsString()
  currency!: string;

  @IsNumber()
  @Min(1)
  deliveryDays!: number;

  @IsNumber()
  @Min(1)
  validityDays!: number;

  @IsOptional()
  @IsString()
  warranty?: string;

  @IsOptional()
  @IsString()
  commercialNotes?: string;

  @IsOptional()
  @IsObject()
  technicalResponse?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['DRAFT', 'SUBMITTED'])
  status?: 'DRAFT' | 'SUBMITTED';
}

class QuoteDecisionDto {
  @IsIn(['SHORTLISTED', 'REJECTED'])
  status!: 'SHORTLISTED' | 'REJECTED';

  @IsOptional()
  @IsString()
  note?: string;
}

class AwardQuoteDto {
  @IsString()
  quoteId!: string;

  @IsOptional()
  @IsString()
  decisionNote?: string;
}

@Controller('rfqs')
export class RfqController {
  constructor(private readonly rfqs: RfqService) {}

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard)
  @Roles(RoleKey.BUYER_OWNER, RoleKey.BUYER_MANAGER)
  @Permissions('rfqs.create')
  @PlanFeatures('rfq_creation')
  @Post()
  create(@Body() dto: CreateRfqDto, @CurrentTenant() tenant: TenantContext) {
    return this.rfqs.create(dto, tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard)
  @Roles(RoleKey.SUPPLIER_OWNER, RoleKey.SUPPLIER_MANAGER, RoleKey.SUPPLIER_STAFF)
  @Permissions('rfqs.read')
  @Get('supplier/opportunities')
  listSupplierOpportunities(@CurrentTenant() tenant: TenantContext) {
    return this.rfqs.listSupplierOpportunities(tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard)
  @Roles(RoleKey.BUYER_OWNER, RoleKey.BUYER_MANAGER, RoleKey.BUYER_EVALUATOR)
  @Permissions('rfqs.read')
  @Get('buyer/rfqs')
  listBuyerRfqs(@CurrentTenant() tenant: TenantContext) {
    return this.rfqs.listBuyerRfqs(tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard)
  @Roles(RoleKey.SUPPLIER_OWNER, RoleKey.SUPPLIER_MANAGER, RoleKey.SUPPLIER_STAFF)
  @Permissions('rfqs.read')
  @Get('supplier/:id')
  getSupplierOpportunityDetail(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.rfqs.getSupplierOpportunityDetail(id, tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard)
  @Roles(RoleKey.BUYER_OWNER, RoleKey.BUYER_MANAGER, RoleKey.BUYER_EVALUATOR)
  @Permissions('rfqs.evaluate')
  @PlanFeatures('quote_comparison')
  @Get(':id/evaluation')
  evaluateQuotes(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.rfqs.evaluateQuotes(id, tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard)
  @Roles(RoleKey.BUYER_OWNER, RoleKey.BUYER_MANAGER, RoleKey.BUYER_EVALUATOR)
  @Permissions('rfqs.evaluate')
  @PlanFeatures('quote_comparison')
  @Patch(':id/quotes/:quoteId/decision')
  updateQuoteDecision(
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
    @Body() dto: QuoteDecisionDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.rfqs.updateQuoteDecision(id, quoteId, dto, tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard)
  @Roles(RoleKey.BUYER_OWNER, RoleKey.BUYER_MANAGER)
  @Permissions('rfqs.evaluate')
  @PlanFeatures('quote_comparison')
  @Post(':id/award')
  awardQuote(@Param('id') id: string, @Body() dto: AwardQuoteDto, @CurrentTenant() tenant: TenantContext) {
    return this.rfqs.awardQuote(id, dto, tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard)
  @Roles(RoleKey.SUPPLIER_OWNER, RoleKey.SUPPLIER_MANAGER, RoleKey.SUPPLIER_STAFF)
  @Permissions('quotes.create')
  @PlanFeatures('quote_comparison')
  @Post(':id/quotes')
  submitSupplierQuote(@Param('id') id: string, @Body() dto: SupplierQuoteDto, @CurrentTenant() tenant: TenantContext) {
    return this.rfqs.submitSupplierQuote(id, dto, tenant);
  }

  @UseGuards(AuthGuard, TenantGuard)
  @Get(':id')
  getOne(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.rfqs.getOne(id, tenant);
  }

  @UseGuards(AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard)
  @Roles(RoleKey.BUYER_OWNER, RoleKey.BUYER_MANAGER)
  @Permissions('rfqs.publish')
  @PlanFeatures('rfq_creation')
  @Patch(':id/publish')
  publish(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.rfqs.publish(id, tenant);
  }
}
