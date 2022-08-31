import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { HomeTypeEnum, YardTypeEnum } from '../entities/provider-home.entity';

export class CreateProviderHomeDto {
  @ApiProperty({ type: 'enum', enum: HomeTypeEnum })
  @IsEnum(HomeTypeEnum)
  homeType: HomeTypeEnum;

  @ApiProperty({ type: 'enum', enum: YardTypeEnum })
  @IsEnum(YardTypeEnum)
  yardType: YardTypeEnum;

  @ApiProperty({ isArray: true, type: 'number' })
  homeAttributes: number[];
}
