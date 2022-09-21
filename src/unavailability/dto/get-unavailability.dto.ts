import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetUnavailabilityDto {
  @ApiProperty({
    description: 'The six digit unique user opk',
  })
  @IsString()
  @IsNotEmpty()
  opk: string;

  @ApiProperty({
    default: new Date().toISOString(),
  })
  @IsNotEmpty()
  @IsDateString()
  from: string;

  @ApiProperty({
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  range?: number;
}
