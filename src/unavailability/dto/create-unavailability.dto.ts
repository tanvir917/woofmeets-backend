import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUnavailibityDto {
  @ApiProperty({
    description: 'Send an ISO formatted datetime string',
    required: true,
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @IsNotEmpty()
  disableAllServices: boolean = false;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  providerServiceId?: number;

  @ApiProperty({
    deprecated: true,
    required: false,
    description: 'Default is Etc/Utc',
  })
  @IsOptional()
  @IsString()
  returnZone: string = 'Etc/UTC';
}
