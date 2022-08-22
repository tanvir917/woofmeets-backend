import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { LoginProviderEnum } from 'src/utils/enums';

export class SocialAuthDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty()
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  firstName: string;

  @IsNotEmpty()
  @ApiProperty()
  lastName: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsEnum(LoginProviderEnum)
  provider: LoginProviderEnum;

  @IsOptional()
  @ApiProperty()
  facebookId?: string;
}
