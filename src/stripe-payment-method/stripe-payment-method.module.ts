import { Module } from '@nestjs/common';
import { StripePaymentMethodService } from './stripe-payment-method.service';
import { StripePaymentMethodController } from './stripe-payment-method.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';

@Module({
  imports: [PrismaModule, SecretModule],
  controllers: [StripePaymentMethodController],
  providers: [StripePaymentMethodService],
})
export class StripePaymentMethodModule {}
