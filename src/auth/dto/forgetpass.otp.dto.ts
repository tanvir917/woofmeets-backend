import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgetPasswordOtpDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;
}
