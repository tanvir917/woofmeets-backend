import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MESSAGE_SERVICE_NAMES } from './config.type';

// https://www.npmjs.com/package/nestjs-amqp

@Injectable()
export class MessagingProxyService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly amqpConnection: AmqpConnection,
  ) {
    this.logger.setContext(MessagingProxyService.name);
  }

  async sendMessage(message?: string) {
    this.amqpConnection.publish<{
      name: string;
    }>(
      MESSAGE_SERVICE_NAMES.MESSAGE_EXCHANGE,
      MESSAGE_SERVICE_NAMES.MESSAGE_TOPIC,
      {
        name: message,
      },
      {
        persistent: true,
      },
    );

    return message ?? `No message`;
  }
}
