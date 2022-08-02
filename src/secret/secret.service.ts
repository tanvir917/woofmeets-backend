import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { PinoLogger } from 'nestjs-pino';
import { EnvironmentVariable } from 'src/global/config';

@Injectable()
export class SecretService {
  #environment: EnvironmentVariable;

  constructor(private readonly configService: ConfigService) {
    if (!this.#environment) {
      this.prepare();
    }
  }

  prepare() {
    this.#environment = plainToInstance(EnvironmentVariable, {
      DATABASE_URL: this.configService.get<string>('DATABASE_URL'),
      PORT: this.configService.get<number>('PORT', 5000),
      LOGGER_CONTEXT: this.configService.get<string>(
        'LOGGER_CONTEXT',
        'Woofmeets',
      ),
      LOG_LEVEL: this.configService.get<
        'debug' | 'info' | 'warn' | 'error' | 'fatal'
      >('LOG_LEVEL', 'info'),
    });
  }

  getLoggerCreds() {
    return {
      CONTEXT: this.#environment.LOGGER_CONTEXT,
      LEVEL: this.#environment.LOG_LEVEL,
    };
  }

  getPort(): number {
    return this.#environment.PORT;
  }
}
