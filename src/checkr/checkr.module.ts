import { Module } from '@nestjs/common';
import { CheckrService } from './checkr.service';
import { CheckrController } from './checkr.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';

@Module({
  imports: [PrismaModule, SecretModule],
  controllers: [CheckrController],
  providers: [CheckrService],
  exports: [CheckrService],
})
export class CheckrModule {}
