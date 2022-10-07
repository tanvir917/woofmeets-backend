import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  HomeTypeEnum,
  YardTypeEnum,
} from 'src/provider-home/entities/provider-home.entity';

export class SearchProviderDto {
  @ApiProperty({ required: true, example: 'boarding' })
  @IsString()
  service: string;

  @ApiProperty({ required: true, example: 1 })
  @IsNumber()
  serviceId: number;

  @ApiProperty({ example: 'cat', required: false })
  @IsString()
  @IsOptional()
  pet_type: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  petsId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  service_frequency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  lat: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  lng: number;

  @ApiProperty({ example: new Date().toISOString(), required: false })
  @IsOptional()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: new Date().toISOString(), required: false })
  @IsOptional()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    enum: [HomeTypeEnum.FARM, HomeTypeEnum.HOUSE, HomeTypeEnum.APARTMENT],
    required: false,
  })
  @IsOptional()
  @IsEnum(HomeTypeEnum)
  homeType: string;

  @ApiProperty({
    enum: [YardTypeEnum.FENCED, YardTypeEnum.UNFENCED, YardTypeEnum.NO_YARD],
    required: false,
  })
  @IsOptional()
  @IsEnum(YardTypeEnum)
  yardType: string;

  @ApiProperty({
    example: '1,2,3',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferenceIds: string;
}
