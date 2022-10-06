import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AdminPanelController } from './admin-panel.controller';
import { AdminPanelService } from './admin-panel.service';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPanelController],
  providers: [AdminPanelService],
})
export class AdminPanelModule {}
