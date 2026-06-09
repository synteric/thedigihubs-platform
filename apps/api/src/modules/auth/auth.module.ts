import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PermissionGuard } from './permission.guard';
import { PlanGuard } from './plan.guard';
import { RoleGuard } from './role.guard';
import { TenantGuard } from './tenant.guard';

@Module({
  imports: [PrismaModule, AuditModule, NotificationModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard],
  exports: [AuthService, AuthGuard, TenantGuard, RoleGuard, PermissionGuard, PlanGuard],
})
export class AuthModule {}
