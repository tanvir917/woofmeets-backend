import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { FileModule } from 'src/file/file.module';
import { MessagingModule } from 'src/messaging/messaging.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderServicesModule } from 'src/provider-services/provider-services.module';
import { SecretModule } from 'src/secret/secret.module';
import { ServiceRatesModule } from 'src/service-rates/service-rates.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentProposalService } from './services/appointment-proposal.service';
import { AppointmentRecurringService } from './services/appointment-recurring.service';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    ProviderServicesModule,
    SecretModule,
    MessagingModule,
    FileModule,
    ServiceRatesModule,
  ],
  providers: [AppointmentProposalService, AppointmentRecurringService],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
