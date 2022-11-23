import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { EmailModule } from 'src/email/email.module';
import { FileModule } from 'src/file/file.module';
import { MessagingModule } from 'src/messaging/messaging.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { ServiceRatesModule } from 'src/service-rates/service-rates.module';
import { SmsModule } from 'src/sms/sms.module';
import { StripeDispatcherService } from '../stripe/stripe.dispatcher.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentCardService } from './services/appointment-card.service';
import { AppointmentPaymentService } from './services/appointment-payment.service';
import { AppointmentProposalService } from './services/appointment-proposal.service';
import { AppointmentProposalServiceV2 } from './services/appointment-proposal.service.V2';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    SecretModule,
    MessagingModule,
    FileModule,
    ServiceRatesModule,
    EmailModule,
    SmsModule,
    // StripeModule,
  ],
  providers: [
    AppointmentProposalService,
    AppointmentProposalServiceV2,
    AppointmentPaymentService,
    AppointmentCardService,
    StripeDispatcherService,
  ],
  controllers: [AppointmentController],
  exports: [AppointmentProposalService],
})
export class AppointmentModule {}
