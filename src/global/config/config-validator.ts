import { plainToClass } from 'class-transformer';
import {
  Equals,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

export class EnvironmentVariable {
  @IsNotEmpty()
  @IsInt()
  @Equals(5000)
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
  @IsNumber()
  OPK_LENGTH: number;
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
