import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { LoggerModule } from 'nestjs-pino';
import { AdminPanelModule } from './admin-panel/admin-panel.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentModule } from './appointment/appointment.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { AwsModule } from './aws/aws.module';
import { CancellationPolicyModule } from './cancellation-policy/cancellation-policy.module';
import { CheckrModule } from './checkr/checkr.module';
import { CommonModule } from './common/common.module';
import { EmailModule } from './email/email.module';
import { FileModule } from './file/file.module';
import { GalleryModule } from './gallery/gallery.module';
import {
  ASYNC_LOGGER_CONFIG,
  validateEnvironmentVariables,
} from './global/config';
import { GlobalModule } from './global/global.module';
import { MessagingModule } from './messaging/messaging.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { PetPreferenceModule } from './pet-preference/pet-preference.module';
import { PetModule } from './pet/pet.module';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { ProviderHomeModule } from './provider-home/provider-home.module';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { ProviderModule } from './provider/provider.module';
import { QuizModule } from './quiz/quiz.module';
import { SecretModule } from './secret/secret.module';
import { SecretService } from './secret/secret.service';
import { ServiceRatesModule } from './service-rates/service-rates.module';
import { ServiceTypesModule } from './service-types/service-types.module';
import { SmsModule } from './sms/sms.module';
import { SmsService } from './sms/sms.service';
import { StripePaymentMethodModule } from './stripe-payment-method/stripe-payment-method.module';
import { StripeModule } from './stripe/stripe.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { UnavailabilityModule } from './unavailability/unavailability.module';
import { UserProfileModule } from './user-profile/user-profile.module';
import { ZoomModule } from './zoom/zoom.module';
import { StripeConnectModule } from './stripe-connect/stripe-connect.module';
import { CouponsModule } from './coupons/coupons.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnvironmentVariables,
      isGlobal: true,
      envFilePath: '.env',
    }),
    SecretModule,
    LoggerModule.forRootAsync(ASYNC_LOGGER_CONFIG),
    CacheModule.register({
      ttl: 5000,
      max: 100,
    }),
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
    ZoomModule,
    StripePaymentMethodModule,
    AvailabilityModule,
    QuizModule,
    ProviderModule,
    UnavailabilityModule,
    SubscriptionsModule,
    StripeModule,
    CheckrModule,
    ZoomModule,
    AppointmentModule,
    MessagingModule,
    AdminPanelModule,
    StripeConnectModule,
    CouponsModule,
    ReviewModule,
  ],
  controllers: [AppController],
  providers: [AppService, SecretService, PrismaService, SmsService],
})
export class AppModule {}
