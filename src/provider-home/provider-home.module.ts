import { Module } from '@nestjs/common';
import { ProviderHomeService } from './provider-home.service';
import { ProviderHomeController } from './provider-home.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProviderHomeController],
  providers: [ProviderHomeService],
})
export class ProviderHomeModule {}
