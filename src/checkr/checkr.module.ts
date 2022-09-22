import { Module } from '@nestjs/common';
import { CheckrService } from './checkr.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';

@Module({
  imports: [PrismaModule, SecretModule],
  providers: [CheckrService],
  exports: [CheckrService],
})
export class CheckrModule {}
