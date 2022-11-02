import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TimingType } from '../helpers/appointment-visits';

export class GetModifiedDayCarePriceDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty()
  @IsNotEmpty()
  petIds: any;

  @ApiProperty()
  @IsOptional()
  @IsDateString({}, { each: true })
  dates: string[];

  @ApiProperty()
  @IsBoolean()
  isRecurring: boolean;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  recurringStartDate: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ each: true })
  recurringSelectedDays: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  timeZone: string;

  @ApiProperty()
  @IsNotEmpty()
  timing: TimingType;
}

export class GetModifiedBoardingHouseSittingPriceDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty()
  @IsNotEmpty()
  petIds: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  proposalStartDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  proposalEndDate: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  timeZone: string;

  @ApiProperty()
  @IsNotEmpty()
  timing: TimingType;
}

export class GetModifiedVisitWalkPriceDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty()
  @IsNotEmpty()
  petIds: any;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isRecurring: boolean;

  @ApiProperty()
  @IsNotEmpty()
  length: number;

  @ApiProperty()
  @IsOptional()
  @IsDateString()
  recurringStartDate: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  proposalVisits: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  timeZone: string;
}
