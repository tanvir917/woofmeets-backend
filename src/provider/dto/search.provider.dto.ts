import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchProviderDto {
  @ApiProperty({ required: true, example: 'boarding' })
  @IsString()
  service: string;

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
}
