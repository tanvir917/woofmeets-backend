import { Module } from '@nestjs/common';
import { AvailabilityGetServcie } from 'src/availability/services/availability.get.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ProviderController],
  providers: [ProviderService, AvailabilityGetServcie],
})
export class ProviderModule {}
