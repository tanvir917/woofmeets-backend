import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class TestEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  subject: string;

  @IsOptional()
  @ApiProperty()
  message?: string;

  @IsNotEmpty()
  @ApiProperty()
  otp: string;
}
