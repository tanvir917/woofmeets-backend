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
      AWS_ACCESS_KEY: this.configService.get<string>('AWS_ACCESS_KEY'),
      AWS_SECRET_ACCESS_KEY: this.configService.get<string>(
        'AWS_SECRET_ACCESS_KEY',
      ),
      BUCKET_NAME: this.configService.get<string>('BUCKET_NAME'),
      AWS_BUCKET_REGION: this.configService.get<string>('AWS_BUCKET_REGION'),
      AWS_UPLOAD_PATH: this.configService.get<string>('AWS_UPLOAD_PATH'),
      AWS_UPLOAD_SIZE: this.configService.get<number>(
        'AWS_UPLOAD_SIZE',
        10000000,
      ),
      AWS_API_VERSION: this.configService.get<string>(
        'AWS_API_VERSION',
        '2006-03-01',
      ),
      RND_TOKEN_STRING: this.configService.get<string>('RND_TOKEN_STRING'),
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

  getAwsCreds() {
    return {
      awsAccessId: this.#environment.AWS_ACCESS_KEY,
      awsSecret: this.#environment.AWS_SECRET_ACCESS_KEY,
      awsRegion: this.#environment.AWS_BUCKET_REGION,
      awsBucket: this.#environment.BUCKET_NAME,
      awsUploadPath: this.#environment.AWS_UPLOAD_PATH,
      awsUploadSize: this.#environment.AWS_UPLOAD_SIZE,
      apiVersion: this.#environment.AWS_API_VERSION,
    };
  }

  getRndTokenString(): string {
    return this.#environment.RND_TOKEN_STRING;
  }
}
