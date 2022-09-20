import { Module } from '@nestjs/common';
import { AvailabilityService } from './services/availability.service';
import { AvailabilityController } from './availability.controller';
import { SecretModule } from 'src/secret/secret.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AvailableDateService } from './services/available.date.service';
import { AvailabilityGetServcie } from './services/availability.get.service';

@Module({
  imports: [SecretModule, PrismaModule],
  controllers: [AvailabilityController],
  providers: [
    AvailabilityService,
    AvailabilityGetServcie,
    AvailableDateService,
  ],
})
export class AvailabilityModule {}
