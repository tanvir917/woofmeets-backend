import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserApplicationVersionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  iosForceUpdateVersion: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  androidForceUpdateVersion: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  androidStoreUrl: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  iosStoreUrl: string;

  @ApiProperty()
  @IsOptional()
  meta: object;
}
