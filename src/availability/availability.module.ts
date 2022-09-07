import { Module } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { SecretModule } from 'src/secret/secret.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [SecretModule, PrismaModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}
