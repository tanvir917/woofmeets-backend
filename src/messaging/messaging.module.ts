import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MessagingController } from './messaging.controller';
import { MessagingProxyService } from './messaging.service';
// https://www.npmjs.com/package/nestjs-rmq
@Module({
  imports: [],
  providers: [MessagingProxyService, ConfigService],
  controllers: [MessagingController],
  exports: [MessagingProxyService],
})
export class MessagingModule {}
