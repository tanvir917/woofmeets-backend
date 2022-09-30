import { Module } from '@nestjs/common';
import { AvailabilityGetServcie } from 'src/availability/services/availability.get.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderController } from './provider.controller';
import { ProviderService } from './provider.service';
import { ProviderCreationService } from './provider-creation.service';
import { CommonModule } from 'src/common/common.module';
import { PasswordService } from 'src/auth/password.service';
import { CommonService } from 'src/common/common.service';
import { EmailModule } from 'src/email/email.module';
import { SecretModule } from 'src/secret/secret.module';

@Module({
  imports: [PrismaModule, JwtModule, CommonModule, EmailModule, SecretModule],
  controllers: [ProviderController],
  providers: [
    ProviderService,
    AvailabilityGetServcie,
    ProviderCreationService,
    PasswordService,
    CommonService,
  ],
})
export class ProviderModule {}
