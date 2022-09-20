import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateAvailableDateDto {
  // @ApiProperty({ required: false })
  // @IsNumber()
  // @IsOptional()
  // serviceId?: number;

  @ApiProperty({
    required: false,
    isArray: true,
    default: [],
    description: 'If empty, all provided services will become disabled',
  })
  @IsOptional()
  @IsInt({
    each: true,
  })
  providerServiceIds: number[] = [];

  @ApiProperty({ example: new Date().toISOString() })
  @IsDateString()
  @IsNotEmpty()
  from: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  to: string;
}
