import { Module } from '@nestjs/common';
import { SmsModule } from 'src/sms/sms.module';
import { AppointmentModule } from '../appointment/appointment.module';
import { CheckrModule } from '../checkr/checkr.module';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';
import { StripeConnectWebhooksService } from './stripe-connect-webhooks.service';
import { StripeWebhooksService } from './stripe-webhooks.service';
import { StripeController } from './stripe.controller';
import { StripeDispatcherService } from './stripe.dispatcher.service';
import { StripeService } from './stripe.service';

@Module({
  imports: [
    PrismaModule,
    SecretModule,
    CheckrModule,
    AppointmentModule,
    EmailModule,
    SmsModule,
  ],
  controllers: [StripeController],
  providers: [
    StripeWebhooksService,
    StripeConnectWebhooksService,
    StripeService,
    StripeDispatcherService,
  ],
  exports: [StripeDispatcherService],
})
export class StripeModule {}
