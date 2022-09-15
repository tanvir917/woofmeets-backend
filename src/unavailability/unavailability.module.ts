import { UnavailabilityDeletionService } from './unavailability-delete.service';
import { UnavailabilityCreationService } from './unavailability-creation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { UnavailabilityController } from './unavailability.controller';

@Module({
  providers: [
    PrismaService,
    UnavailabilityCreationService,
    UnavailabilityDeletionService,
  ],
  controllers: [UnavailabilityController],
})
export class UnavailabilityModule {}
