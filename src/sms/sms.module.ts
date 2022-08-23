import { Module } from '@nestjs/common';
import { SecretModule } from 'src/secret/secret.module';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Module({
  imports: [SecretModule],
  providers: [SmsService],
  controllers: [SmsController],
})
export class SmsModule {}
