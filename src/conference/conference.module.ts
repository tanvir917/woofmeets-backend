import { Module } from '@nestjs/common';
import { ConferenceService } from './servcies/conference.service';
import { ConferenceController } from './conference.controller';
import { SecretModule } from 'src/secret/secret.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { SecretService } from 'src/secret/secret.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    SecretModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    JwtModule.registerAsync({
      imports: [SecretModule],
      inject: [SecretService],
      useFactory: async (secretService: SecretService) => {
        return {
          secret: secretService.getHmsCreds().hmsSecret,
          signOptions: { expiresIn: '1m' },
        };
      },
    }),
  ],
  controllers: [ConferenceController],
  providers: [ConferenceService],
})
export class ConferenceModule {}
