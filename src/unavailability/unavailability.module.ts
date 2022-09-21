import { UnavailabilityDeletionService } from './unavailability-delete.service';
import { UnavailabilityCreationService } from './unavailability-creation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { UnavailabilityController } from './unavailability.controller';
import { UnavailabilityService } from './unavailability.service';

@Module({
  providers: [
    PrismaService,
    UnavailabilityCreationService,
    UnavailabilityDeletionService,
    UnavailabilityService,
  ],
  controllers: [UnavailabilityController],
})
export class UnavailabilityModule {}
