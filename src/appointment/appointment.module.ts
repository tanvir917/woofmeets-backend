import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { EmailModule } from 'src/email/email.module';
import { FileModule } from 'src/file/file.module';
import { MessagingModule } from 'src/messaging/messaging.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { ServiceRatesModule } from 'src/service-rates/service-rates.module';
import { StripeDispatcherService } from '../stripe/stripe.dispatcher.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentPaymentService } from './services/appointment-payment.service';
import { AppointmentProposalService } from './services/appointment-proposal.service';
import { AppointmentRecurringService } from './services/appointment-recurring.service';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    SecretModule,
    MessagingModule,
    FileModule,
    ServiceRatesModule,
    EmailModule,
    // StripeModule,
  ],
  providers: [
    AppointmentProposalService,
    AppointmentRecurringService,
    AppointmentPaymentService,
    StripeDispatcherService,
  ],
  controllers: [AppointmentController],
  exports: [AppointmentProposalService],
})
export class AppointmentModule {}
