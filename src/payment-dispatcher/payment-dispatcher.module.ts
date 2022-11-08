import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { AdminPanelModule } from '../admin-panel/admin-panel.module';
import { PaymentDispatcherController } from './payment-dispatcher.controller';
import { PaymentDispatcherService } from './payment-dispatcher.service';

@Module({
  imports: [PrismaModule, SecretModule, AdminPanelModule],
  controllers: [PaymentDispatcherController],
  providers: [PaymentDispatcherService],
})
export class PaymentDispatcherModule {}
