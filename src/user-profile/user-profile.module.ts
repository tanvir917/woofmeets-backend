import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EmailModule } from 'src/email/email.module';
import { FileModule } from 'src/file/file.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { SmsModule } from 'src/sms/sms.module';
import { ProviderDetailsService } from './provider-details.service';
import { UserOnboardingProgressService } from './user-onboarding-progress.service';
import { UserProfileBasicInfoService } from './user-profile-basic-info.service';
import { UserProfileContactService } from './user-profile-contact.service';
import { UserProfileController } from './user-profile.controller';
import { UserProfileService } from './user-profile.service';

@Module({
  imports: [
    PrismaModule,
    SmsModule,
    FileModule,
    SecretModule,
    EmailModule,
    HttpModule,
  ],
  controllers: [UserProfileController],
  providers: [
    UserProfileService,
    UserProfileBasicInfoService,
    ProviderDetailsService,
    UserProfileContactService,
    UserOnboardingProgressService,
  ],
})
export class UserProfileModule {}
