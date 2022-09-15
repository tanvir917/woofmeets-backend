import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { addDays } from 'date-fns';

export class DeleteUnavailabilityDto {
  @ApiProperty({
    default: new Date(),
  })
  @IsNotEmpty()
  @IsDateString()
  from: string;

  @ApiProperty({
    required: false,
    default: addDays(new Date(), 1),
    description: '**Make sure** this is greater than `from` date',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiProperty({
    required: false,
    isArray: true,
    default: [],
    description:
      'If empty, all unavailabilities across this range will be deleted',
  })
  @IsOptional()
  @IsInt({
    each: true,
  })
  providerServiceIds: number[] = [];
}
