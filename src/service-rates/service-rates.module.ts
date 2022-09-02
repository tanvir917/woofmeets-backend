import { Module } from '@nestjs/common';
import { ServiceRatesService } from './service-rates.service';
import { ServiceRatesController } from './service-rates.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { ServiceTypeHasRatesService } from './service-type-has-rate.service';

@Module({
  imports: [SecretModule, PrismaModule],
  controllers: [ServiceRatesController],
  providers: [ServiceRatesService, ServiceTypeHasRatesService],
})
export class ServiceRatesModule {}
