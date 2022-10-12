import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class RecommendedProviderDto {
  @ApiProperty({ required: false, example: 1 })
  @IsNumber()
  @IsOptional()
  serviceTypeId: number;

  @ApiProperty({ required: false, deprecated: true })
  @IsOptional()
  @IsNumber()
  lat: number;

  @ApiProperty({ required: false, deprecated: true })
  @IsNumber()
  @IsOptional()
  lng: number;
}
