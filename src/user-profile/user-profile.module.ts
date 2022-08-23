import { Module } from '@nestjs/common';
import { UserProfileBasicInfoService } from './user-profile-basic-info.service';
import { UserProfileController } from './user-profile.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileModule } from 'src/file/file.module';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [UserProfileController],
  providers: [UserProfileBasicInfoService],
})
export class UserProfileModule {}
