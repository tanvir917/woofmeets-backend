import { Module } from '@nestjs/common';
import { StripeController } from './stripe.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';
import { StripeWebhooksService } from './stripe-webhooks.service';

@Module({
  imports: [PrismaModule, SecretModule],
  controllers: [StripeController],
  providers: [StripeWebhooksService],
})
export class StripeModule {}
