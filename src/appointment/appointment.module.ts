import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentProposalService } from './services/appointment-proposal.service';

@Module({
  providers: [PrismaService, AppointmentProposalService],
  controllers: [AppointmentController],
})
export class AppointmentModule {}
