import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
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
    enum: [HomeTypeEnum.BUSINESS, HomeTypeEnum.HOUSE, HomeTypeEnum.APARTMENT],
    required: false,
  })
  @IsOptional()
  @IsEnum([HomeTypeEnum.BUSINESS, HomeTypeEnum.HOUSE, HomeTypeEnum.APARTMENT])
  homeType: string;

  @ApiProperty({
    enum: [YardTypeEnum.FENCED, YardTypeEnum.UNFENCED, YardTypeEnum.NO_YARD],
    required: false,
  })
  @IsOptional()
  @IsEnum([YardTypeEnum.FENCED, YardTypeEnum.UNFENCED, YardTypeEnum.NO_YARD])
  yardType: string;

  @ApiProperty({
    example: '1,2,3',
    required: false,
  })
  @IsOptional()
  @IsString()
  preferenceIds: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  minPrice: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxPrice: number;

  @ApiProperty({ required: false, default: 1, description: 'Page #' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    default: 20,
    description: 'Item limit per page',
  })
  @IsNumber()
  @IsOptional()
  limit?: number;
}
