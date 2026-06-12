import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { RfqModule } from './rfq/rfq.module';
import { MatchingModule } from './matching/matching.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { AdminModule } from './admin/admin.module';
import { ContactModule } from './contact/contact.module';
import { DocumentModule } from './document/document.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    MarketplaceModule,
    RfqModule,
    MatchingModule,
    AuditModule,
    AuthModule,
    SubscriptionModule,
    ContactModule,
    DocumentModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
