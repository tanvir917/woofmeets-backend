import { Module } from '@nestjs/common';
import { BalancesService } from './balances.service';
import { BalancesController } from './balances.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SecretModule } from '../secret/secret.module';

@Module({
  imports: [PrismaModule, SecretModule],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}
