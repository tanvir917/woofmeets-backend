import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';
import { FileModule } from '../file/file.module';
import { MembershipPlanService } from './membership-plan.service';
import { CommonModule } from '../common/common.module';
import { MembershipPlanPricesService } from './membership-plan-prices-service';
import { SubscriptionV2Service } from './subscription-v2.service';

@Module({
  imports: [PrismaModule, SecretModule, FileModule, CommonModule],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    MembershipPlanService,
    MembershipPlanPricesService,
    SubscriptionV2Service,
  ],
})
export class SubscriptionsModule {}
