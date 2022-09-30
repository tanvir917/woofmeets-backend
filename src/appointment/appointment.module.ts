import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderServicesModule } from 'src/provider-services/provider-services.module';
import { SecretModule } from 'src/secret/secret.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentProposalService } from './services/appointment-proposal.service';

@Module({
  imports: [CommonModule, PrismaModule, ProviderServicesModule, SecretModule],
  providers: [AppointmentProposalService],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
