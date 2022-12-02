import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlatformTypeEnum } from '../entities/platform-type.entity';

export class GetForceUpdateQueryDto {
  @ApiProperty({ example: 'IOS' })
  @IsEnum(PlatformTypeEnum)
  @IsNotEmpty()
  platform: PlatformTypeEnum;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  version: string;
}
