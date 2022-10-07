import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MessagingController } from './messaging.controller';
import { MessagingProxyService } from './messaging.service';
// https://www.npmjs.com/package/nestjs-rmq
@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      name: 'rabbitmq-nestjs',
      uri: process.env.RABBIT_MQ_URL,
      exchanges: [
        {
          name: 'MESSAGING_EXCHANGE',
          type: 'direct',
          options: {
            durable: true,
          },
        },
      ],
      defaultExchangeType: 'direct',
      channels: {
        [process.env.MESSAGE_MICROSERVICE_CHANNEL]: {
          default: true,
          prefetchCount: 1,
        },
      },
      connectionInitOptions: {
        wait: true,
      },
    }),
  ],
  providers: [MessagingProxyService, ConfigService],
  controllers: [MessagingController],
})
export class MessagingModule {}
