import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecretService } from './secret.service';

@Global()
@Module({
  providers: [SecretService, ConfigService],
  exports: [SecretService],
  imports: [ConfigModule],
})
export class SecretModule {}
