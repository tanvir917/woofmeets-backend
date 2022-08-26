import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class CreateEmergencyContactDto {
  @ApiProperty({
    required: false,
    description:
      'Ensure that the user also adds emergency contact phone number and email',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  phone?: string;
}

export class GeneratePhoneOTPDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber()
  phoneNumber: string;
}

export class CreateUserContactDto extends GeneratePhoneOTPDto {
  @ApiProperty({
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  otp: string;
}
