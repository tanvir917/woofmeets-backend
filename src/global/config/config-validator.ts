import { plainToClass } from 'class-transformer';
import {
  Equals,
  IsEnum,
  IsInt,
  IsNotEmpty,
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
