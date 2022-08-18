import { Module } from '@nestjs/common';
import { ServiceTypesService } from './service-types.service';
import { ServiceTypesController } from './service-types.controller';
import { SecretModule } from 'src/secret/secret.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [SecretModule, PrismaModule],
  controllers: [ServiceTypesController],
  providers: [ServiceTypesService],
})
export class ServiceTypesModule {}
