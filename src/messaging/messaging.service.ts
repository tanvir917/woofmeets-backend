import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { CreateGroupDTO } from './dto/messages.dto';

// https://www.npmjs.com/package/nestjs-amqp

@Injectable()
export class MessagingProxyService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(MessagingProxyService.name);
  }

  async sendMessage(message?: string) {
    return message ?? `No message`;
  }

  async createGroup(
    req: any,
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
          {
            headers: {
              Authorization: `Bearer ${
                req?.cookies?.token || req?.headers?.authorization
              }`,
            },
          },
        );
        return result.data;
      } catch (error) {
        this.logger.error({ error });
      }
    } else if (sendWith === 'rabbitmq') {
      this.logger.error('RabbitMq implementation removed');
      return true;
    }
  }

  async deleteGroup(
    req: Request,
    sendWith: 'axios' | 'rabbitmq' = 'axios',
    id: string,
  ) {
    if (sendWith === 'axios') {
      try {
        const result = await axios.delete(
          `${this.configService.get<string>(
            'MICROSERVICE_URL',
          )}/v1/groups/${id}`,
          {
            headers: {
              Authorization: `Bearer ${
                req?.cookies?.token || req?.headers?.authorization
              }`,
            },
          },
        );
        return result.data;
      } catch (error) {
        this.logger.error({ error });
      }
    } else if (sendWith === 'rabbitmq') {
      this.logger.error('RabbitMq implementation removed');
      return true;
    }
  }
}
