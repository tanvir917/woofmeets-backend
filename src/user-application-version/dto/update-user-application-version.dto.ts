import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserApplicationVersionDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty()
  @IsString()
  iosForceUpdateVersion: string;

  @ApiProperty()
  @IsString()
  androidForceUpdateVersion: string;

  @ApiProperty()
  @IsString()
  androidStoreUrl: string;

  @ApiProperty()
  @IsString()
  iosStoreUrl: string;

  @ApiProperty()
  @IsOptional()
  meta?: object;
}
