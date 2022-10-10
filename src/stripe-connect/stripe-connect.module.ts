import { Module } from '@nestjs/common';
import { StripeConnectService } from './stripe-connect.service';
import { StripeConnectController } from './stripe-connect.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';

@Module({
  imports: [PrismaModule, SecretModule],
  controllers: [StripeConnectController],
  providers: [StripeConnectService],
})
export class StripeConnectModule {}
