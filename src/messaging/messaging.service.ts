import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { MESSAGE_SERVICE_NAMES } from './config.type';
import { CreateGroupDTO } from './dto/messages.dto';

// https://www.npmjs.com/package/nestjs-amqp

@Injectable()
export class MessagingProxyService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
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

  async createGroup(
    sendWith: 'axios' | 'rabbitmq' = 'axios',
    body: CreateGroupDTO,
  ) {
    if (sendWith === 'axios') {
      try {
        const result = await axios.post(
          `${this.configService.get<string>(
            'MICROSERVICE_URL',
          )}/v1/groups/users`,
          body,
        );
        return result.data;
      } catch (error) {
        console.log({ error });
      }
    } else if (sendWith === 'rabbitmq') {
      this.amqpConnection.publish<{
        body: string;
      }>(
        MESSAGE_SERVICE_NAMES.MESSAGE_EXCHANGE,
        MESSAGE_SERVICE_NAMES.MESSAGE_TOPIC,
        {
          body: JSON.stringify(body),
        },
        {
          persistent: true,
        },
      );
      return true;
    }
  }
}
