import { Module } from '@nestjs/common';
import { UserApplicationVersionService } from './user-application-version.service';
import { UserApplicationVersionController } from './user-application-version.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminPanelModule } from '../admin-panel/admin-panel.module';
import { SecretModule } from '../secret/secret.module';

@Module({
  imports: [PrismaModule, AdminPanelModule, SecretModule],
  controllers: [UserApplicationVersionController],
  providers: [UserApplicationVersionService],
})
export class UserApplicationVersionModule {}
