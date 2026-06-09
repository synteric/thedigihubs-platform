import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrganizationType, PlanKey, RoleKey, SubscriptionRequestStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CurrentTenant, Roles } from '../auth/auth.decorators';
import { AuthGuard } from '../auth/auth.guard';
import type { TenantContext } from '../auth/auth.types';
import { RoleGuard } from '../auth/role.guard';
import { SubscriptionService } from './subscription.service';

class CreateSubscriptionRequestDto {
  @IsEnum(PlanKey)
  selectedPlan!: PlanKey;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  organizationName!: string;

  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  estimatedUsers?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class ReviewSubscriptionRequestDto {
  @IsEnum(SubscriptionRequestStatus)
  status!: SubscriptionRequestStatus;

  @IsOptional()
  @IsString()
  decisionNote?: string;
}

@Controller('subscription-requests')
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Get('plans')
  plans() {
    return this.subscriptions.plans();
  }

  @Post()
  create(@Body() dto: CreateSubscriptionRequestDto) {
    return this.subscriptions.create(dto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  current(@CurrentTenant() tenant: TenantContext) {
    return this.subscriptions.current(tenant);
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(RoleKey.PLATFORM_ADMIN, RoleKey.PLATFORM_SUPPORT)
  @Get()
  list() {
    return this.subscriptions.list();
  }

  @UseGuards(AuthGuard, RoleGuard)
  @Roles(RoleKey.PLATFORM_ADMIN, RoleKey.PLATFORM_SUPPORT)
  @Patch(':id')
  review(@Param('id') id: string, @Body() dto: ReviewSubscriptionRequestDto, @CurrentTenant() tenant: TenantContext) {
    return this.subscriptions.review(id, dto, tenant);
  }
}
