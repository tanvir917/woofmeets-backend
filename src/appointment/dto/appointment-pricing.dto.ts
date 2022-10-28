import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';
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
  @IsNotEmpty()
  timing: TimingType;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString({}, { each: true })
  dates: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  timeZone: string;
}
