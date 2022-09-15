import { UnavailabilityDeletionService } from './unavailability-delete.service';
import { UnavailabilityCreationService } from './unavailability-creation.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Module } from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';
import { UnavailabilityController } from './unavailability.controller';

@Module({
  providers: [
    PrismaService,
    UnavailabilityService,
    UnavailabilityCreationService,
    UnavailabilityDeletionService,
  ],
  controllers: [UnavailabilityController],
})
export class UnavailabilityModule {}
