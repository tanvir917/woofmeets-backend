import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserOnboardingRefreshUrlDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
