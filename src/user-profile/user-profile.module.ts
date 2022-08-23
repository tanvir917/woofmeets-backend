import { Module } from '@nestjs/common';
import { UserProfileBasicInfoService } from './user-profile-basic-info.service';
import { UserProfileController } from './user-profile.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileModule } from 'src/file/file.module';
import { ProviderDetailsService } from './provider-details.service';
import { UserProfileService } from './user-profile.service';

@Module({
  imports: [PrismaModule, FileModule],
  controllers: [UserProfileController],
  providers: [
    UserProfileService,
    UserProfileBasicInfoService,
    ProviderDetailsService,
  ],
})
export class UserProfileModule {}
