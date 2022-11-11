import { plainToClass, Transform } from 'class-transformer';
import {
  IsBoolean,
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
  SALT_ROUND: number;

  @IsNotEmpty()
  @IsString()
  COOKIE_DOMAIN: string;

  @IsNotEmpty()
  @IsNumber()
  COOKIE_EXPIRE: number;

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

  @IsNotEmpty()
  @IsString()
  MAILCHIMP_API_KEY: string;

  @IsNotEmpty()
  @IsString()
  MAILCHIMP_SUBS_URL: string;

  @IsNotEmpty()
  @IsNumber()
  OTP_VALIDATION_WINDOW: number;

  @IsNotEmpty()
  @IsString()
  ZOOM_HOST_EMAIL: string;

  @IsNotEmpty()
  @IsString()
  ZOOM_JWT_API_KEY: string;

  @IsNotEmpty()
  @IsString()
  ZOOM_JWT_SECRET_KEY: string;

  @IsNotEmpty()
  @IsNumber()
  ZOOM_JWT_EXPIRE: number;

  @IsNotEmpty()
  @IsString()
  ZOOM_OAUTH_CLIENT_ID: string;

  @IsNotEmpty()
  @IsString()
  ZOOM_OAUTH_CLIENT_SECRET: string;

  @IsNotEmpty()
  @IsString()
  ZOOM_OAUTH_REDIRECT_URI: string;

  @IsNotEmpty()
  @IsString()
  STRIPE_SECRET_KEY: string;

  @IsNotEmpty()
  @IsString()
  STRIPE_WEBHOOK_SECRET: string;

  @IsNotEmpty()
  STRIPE_API_VERSION: any;

  // @IsNotEmpty()
  // @IsString()
  // CKR_API_SECRET: string;

  // @IsNotEmpty()
  // @IsString()
  // CKR_BASE_URL: string;

  @IsOptional()
  @IsString()
  RABBIT_MQ_URL?: string;

  @IsOptional()
  @IsString()
  MESSAGE_MICROSERVICE_CHANNEL?: string;

  @IsNotEmpty()
  @IsString()
  MICROSERVICE_URL: string;

  @IsNotEmpty()
  @IsNumber()
  APPOINTMENT_DISTANCE_LIMIT: number;

  @IsNotEmpty()
  @IsNumber()
  APPOINTMENT_INVOICE_NUMBER_LENGTH: number;

  @IsNotEmpty()
  @IsNumber()
  APPOINTMENT_SERVICE_CHARGE_PERCENTAGE: number;

  @IsNotEmpty()
  @IsNumber()
  APPOINTMENT_PROVIDER_CHARGE_PERCENTAGE_BASIC: number;

  @IsNotEmpty()
  @IsNumber()
  APPOINTMENT_PROVIDER_CHARGE_PERCENTAGE_GOLD: number;

  @IsNotEmpty()
  @IsNumber()
  APPOINTMENT_PROVIDER_CHARGE_PERCENTAGE_PLATINUM: number;

  @IsNotEmpty()
  @IsNumber()
  APPOINTMENT_REFUND_PERCENTAGE: number;

  @IsNotEmpty()
  @IsString()
  STRIPE_ONBOARD_RETURN_URL: string;

  @IsNotEmpty()
  @IsString()
  STRIPE_ONBOARD_REFRESH_URL: string;

  @IsNotEmpty()
  @IsString()
  STRIPE_CONNECT_WEBHOOK_SECRET: string;

  @IsNotEmpty()
  @IsString()
  CRYPTO_SECRET: string;

  @IsNotEmpty()
  @IsString()
  PUBLIC_GOOGLE_MAP_KEY: string;

  @IsNotEmpty()
  @IsString()
  PUBLIC_GOOGLE_MAP_SEARCH_REGION: string;

  @IsNotEmpty()
  @IsString()
  ADMIN_PANEL_SEARCH_START_DATE: string;
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
