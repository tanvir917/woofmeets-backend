import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ProviderController],
  providers: [ProviderService],
})
export class ProviderModule {}
