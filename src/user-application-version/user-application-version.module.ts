import { Module } from '@nestjs/common';
import { UserApplicationVersionService } from './user-application-version.service';
import { UserApplicationVersionController } from './user-application-version.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserApplicationVersionController],
  providers: [UserApplicationVersionService],
})
export class UserApplicationVersionModule {}
