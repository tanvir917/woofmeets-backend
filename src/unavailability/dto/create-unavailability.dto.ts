import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { addDays } from 'date-fns';
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
    deprecated: true,
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

export class BulkCreateUnavailabilityDto {
  @ApiProperty({
    default: new Date().toISOString(),
  })
  @IsNotEmpty()
  @IsDateString()
  from: string;

  @ApiProperty({
    required: false,
    default: addDays(new Date(), 1).toISOString(),
    description: '**Make sure** this is greater than `from` date',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

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
}
