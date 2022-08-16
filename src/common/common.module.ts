import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretService } from 'src/secret/secret.service';
import { CommonService } from './common.service';

@Module({
  imports: [PrismaModule],
  providers: [CommonService, ConfigService, SecretService],
  exports: [CommonService],
})
export class CommonModule {}
