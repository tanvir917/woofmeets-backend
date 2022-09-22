import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';
import { StripeWebhooksService } from './stripe-webhooks.service';
import { CheckrModule } from '../checkr/checkr.module';

@Module({
  imports: [PrismaModule, SecretModule, CheckrModule],
  controllers: [StripeController],
  providers: [StripeWebhooksService],
})
export class StripeModule {}
