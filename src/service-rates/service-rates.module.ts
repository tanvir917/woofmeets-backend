import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { ServiceRatesController } from './service-rates.controller';
import { ServiceRatesService } from './service-rates.service';
import { ServiceTypeHasRatesService } from './service-type-has-rate.service';

@Module({
  imports: [SecretModule, PrismaModule],
  controllers: [ServiceRatesController],
  providers: [ServiceRatesService, ServiceTypeHasRatesService],
  exports: [ServiceRatesService, ServiceTypeHasRatesService],
})
export class ServiceRatesModule {}
