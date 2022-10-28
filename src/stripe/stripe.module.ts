import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';
import { StripeWebhooksService } from './stripe-webhooks.service';
import { CheckrModule } from '../checkr/checkr.module';
import { StripeConnectWebhooksService } from './stripe-connect-webhooks.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [PrismaModule, SecretModule, CheckrModule],
  controllers: [StripeController],
  providers: [
    StripeWebhooksService,
    StripeConnectWebhooksService,
    StripeService,
  ],
})
export class StripeModule {}
