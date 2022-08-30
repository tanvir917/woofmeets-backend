import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
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
    const env: EnvironmentVariable = {
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
      JWT_SECRET: this.configService.get<string>('JWT_SECRET'),
      TOKEN_EXPIRE: this.configService.get<string>('TOKEN_EXPIRE'),
      COOKIE_DOMAIN: this.configService.get<string>('COOKIE_DOMAIN'),
      COOKIE_EXPIRE: this.configService.get<number>('COOKIE_EXPIRE'),
      SALT_ROUND: this.configService.get<number>('SALT_ROUND'),
      OPK_LENGTH: this.configService.get<number>('OPK_LENGTH'),
      MAILGUN_USER_NAME: this.configService.get<string>('MAILGUN_USER_NAME'),
      MAILGUN_API_KEY: this.configService.get<string>('MAILGUN_API_KEY'),
      MAILGUN_DOMAIN: this.configService.get<string>('MAILGUN_DOMAIN'),
      MAILGUN_MAIL_FROM: this.configService.get<string>('MAILGUN_MAIL_FROM'),
      TWILIO_ACCOUNT_SID: this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      TWILIO_AUTH_TOKEN: this.configService.get<string>('TWILIO_AUTH_TOKEN'),
      TWILIO_FROM_NUMBER: this.configService.get<string>('TWILIO_FROM_NUMBER'),
      ALLOW_TEST: this.configService.get<boolean>('ALLOW_TEST', false),

      MAILCHIMP_API_KEY: this.configService.get<string>('MAILCHIMP_API_KEY'),
      MAILCHIMP_SUBS_URL: this.configService.get<string>('MAILCHIMP_SUBS_URL'),

      OTP_DURATION: this.configService.get<number>('OTP_DURATION', 5),
      OTP_VALIDATION_WINDOW: this.configService.get<number>(
        'OTP_VALIDATION_WINDOW',
        720,
      ),
    };

    this.#environment = plainToInstance(EnvironmentVariable, env);
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

  getJwtCreds() {
    return {
      jwtSecret: this.#environment.JWT_SECRET,
      jwtExpire: this.#environment.TOKEN_EXPIRE,
      saltRound: this.#environment.SALT_ROUND,
    };
  }

  getCookieCreds() {
    return {
      cookieDomain: this.#environment.COOKIE_DOMAIN,
      cookieExpire: this.#environment.COOKIE_EXPIRE,
    };
  }

  getOpkLength(): number {
    return this.#environment.OPK_LENGTH;
  }

  getOtpDuration(): number {
    return this.#environment.OTP_DURATION;
  }

  getMailgunCreds() {
    return {
      userName: this.#environment.MAILGUN_USER_NAME,
      apiKey: this.#environment.MAILGUN_API_KEY,
      domain: this.#environment.MAILGUN_DOMAIN,
      from: this.#environment.MAILGUN_MAIL_FROM,
    };
  }

  getTwilioCreds(): {
    sid: string;
    token: string;
    number: string;
    allowTest: boolean;
  } {
    return {
      allowTest: this.#environment.ALLOW_TEST,
      sid: this.#environment.TWILIO_ACCOUNT_SID,
      token: this.#environment.TWILIO_AUTH_TOKEN,
      number: this.#environment.TWILIO_FROM_NUMBER,
    };
  }

  getEnv(): 'development' | 'production' | string {
    return process.env?.NODE_ENV ?? 'development';
  }

  getMailchimpCreds() {
    return {
      apiKey: this.#environment.MAILCHIMP_API_KEY,
      subsUrl: this.#environment.MAILCHIMP_SUBS_URL,
    };
  }

  getOtpValidationWindow(): number {
    return this.#environment.OTP_VALIDATION_WINDOW;
  }
}
