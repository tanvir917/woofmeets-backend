import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AppleTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastname?: string;
}

export class Info {
  @ApiProperty()
  id: number;
  @ApiProperty()
  opk: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  emailVerified: boolean;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  password: any;
  @ApiProperty()
  zipcode: any;
  @ApiProperty()
  image: any;
  @ApiProperty()
  loginProvider: string;
  @ApiProperty()
  timezone: any;
  @ApiProperty()
  facebook: any;
  @ApiProperty()
  appleAccountId: string;
  @ApiProperty()
  google: any;
  @ApiProperty()
  meta: any;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  updatedAt: string;
  @ApiProperty()
  deletedAt: any;
  @ApiProperty()
  userEmergencyContactId: any;
  @ApiProperty({
    type: () => Boolean,
  })
  provider: any;
}
export class Data {
  @ApiProperty()
  access_token: string;
  @ApiProperty({
    type: () => Info,
  })
  info: Info;
}

export class OAuthResponseDto {
  @ApiProperty()
  statusCode: number;
  @ApiProperty()
  message: string;
  @ApiProperty({
    type: () => Data,
  })
  data: Data;
}
