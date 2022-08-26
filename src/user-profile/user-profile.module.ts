import { Module } from '@nestjs/common';
import { UserProfileBasicInfoService } from './user-profile-basic-info.service';
import { UserProfileController } from './user-profile.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileModule } from 'src/file/file.module';
import { ProviderDetailsService } from './provider-details.service';
import { UserProfileService } from './user-profile.service';
import { SmsModule } from 'src/sms/sms.module';
import { UserProfileContactService } from './user-profile-contact.service';
import { SecretModule } from 'src/secret/secret.module';

@Module({
  imports: [PrismaModule, SmsModule, FileModule, SecretModule],
  controllers: [UserProfileController],
  providers: [
    UserProfileService,
    UserProfileBasicInfoService,
    ProviderDetailsService,
    UserProfileContactService,
  ],
})
export class UserProfileModule {}