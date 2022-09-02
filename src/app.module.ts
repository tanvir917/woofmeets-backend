import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import {
  ASYNC_LOGGER_CONFIG,
  validateEnvironmentVariables,
} from './global/config';
import { GlobalModule } from './global/global.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { SecretModule } from './secret/secret.module';
import { SecretService } from './secret/secret.service';
import { CommonModule } from './common/common.module';
import { FileModule } from './file/file.module';
import { AwsModule } from './aws/aws.module';
import { EmailModule } from './email/email.module';
import { ServiceTypesModule } from './service-types/service-types.module';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { UserProfileModule } from './user-profile/user-profile.module';
import { SmsService } from './sms/sms.service';
import { SmsModule } from './sms/sms.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { GalleryModule } from './gallery/gallery.module';
import { PetModule } from './pet/pet.module';
import { PetPreferenceModule } from './pet-preference/pet-preference.module';
import { ProviderHomeModule } from './provider-home/provider-home.module';
import { CancellationPolicyModule } from './cancellation-policy/cancellation-policy.module';
import { ServiceRatesModule } from './service-rates/service-rates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnvironmentVariables,
      isGlobal: true,
      envFilePath: '.env',
    }),
    SecretModule,
    LoggerModule.forRootAsync(ASYNC_LOGGER_CONFIG),
    SwaggerModule,
    GlobalModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    FileModule,
    AwsModule,
    EmailModule,
    ServiceTypesModule,
    ProviderServicesModule,
    UserProfileModule,
    SmsModule,
    NewsletterModule,
    GalleryModule,
    PetModule,
    PetPreferenceModule,
    ProviderHomeModule,
    CancellationPolicyModule,
    ServiceRatesModule,
  ],
  controllers: [AppController],
  providers: [AppService, SecretService, PrismaService, SmsService],
})
export class AppModule {}
