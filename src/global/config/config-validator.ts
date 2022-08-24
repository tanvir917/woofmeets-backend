import { plainToClass, Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  validateSync,
} from 'class-validator';

export class EnvironmentVariable {
  @IsNotEmpty()
  @IsInt()
  PORT: number;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  LOGGER_CONTEXT = 'Woofmeets';

  @IsEnum(['debug', 'info', 'warn', 'error', 'fatal'])
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error' | 'fatal' = 'info';

  @IsNotEmpty()
  @IsString()
  AWS_ACCESS_KEY: string;

  @IsNotEmpty()
  @IsString()
  AWS_SECRET_ACCESS_KEY: string;

  @IsNotEmpty()
  @IsString()
  BUCKET_NAME: string;

  @IsNotEmpty()
  @IsString()
  AWS_BUCKET_REGION: string;

  @IsNotEmpty()
  @IsString()
  AWS_UPLOAD_PATH: string;

  @IsNotEmpty()
  @IsInt()
  AWS_UPLOAD_SIZE: number;

  @IsNotEmpty()
  @IsString()
  AWS_API_VERSION: string;

  @IsNotEmpty()
  @IsString()
  RND_TOKEN_STRING: string;

  @IsNotEmpty()
  @IsString()
  JWT_SECRET: string;

  @IsNotEmpty()
  @IsString()
  TOKEN_EXPIRE: string;

  @IsNotEmpty()
  @IsNumber()
  @IsNumber()
  SALT_ROUND: number;

  @IsNotEmpty()
  @IsNumber()
  OPK_LENGTH: number;

  @IsNotEmpty()
  @IsString()
  MAILGUN_USER_NAME: string;

  @IsNotEmpty()
  @IsString()
  MAILGUN_API_KEY: string;

  @IsNotEmpty()
  @IsString()
  MAILGUN_DOMAIN: string;

  @IsNotEmpty()
  @IsString()
  MAILGUN_MAIL_FROM: string;

  @IsNotEmpty()
  @IsString()
  TWILIO_ACCOUNT_SID: string;

  @IsNotEmpty()
  @IsString()
  TWILIO_AUTH_TOKEN: string;

  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  TWILIO_FROM_NUMBER: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value ?? false;
  })
  ALLOW_TEST = false;

  @IsNotEmpty()
  @IsNumber()
  OTP_DURATION: number;
}

export function validateEnvironmentVariables(
  configuration: Record<string, unknown>,
) {
  const finalConfig = plainToClass(EnvironmentVariable, configuration, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(finalConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return finalConfig;
}
