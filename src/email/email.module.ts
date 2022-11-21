import { Module } from '@nestjs/common';
import { MailgunModule } from '@nextnm/nestjs-mailgun';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { SecretService } from 'src/secret/secret.service';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  imports: [
    SecretModule,
    MailgunModule.forAsyncRoot({
      imports: [SecretModule],
      inject: [SecretService],
      useFactory: async (secretService: SecretService) => ({
        username: secretService.getMailgunCreds().userName,
        key: secretService.getMailgunCreds().apiKey,
      }),
    }),
    PrismaModule,
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
