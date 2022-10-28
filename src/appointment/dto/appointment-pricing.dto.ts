import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetModifiedDayCarePriceDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty()
  @IsNotEmpty()
  petIds: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString({}, { each: true })
  dates: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  timeZone: string;
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
}
