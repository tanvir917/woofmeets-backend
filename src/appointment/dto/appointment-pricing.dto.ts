import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';
import { TimingType } from '../helpers/appointment-visits';

export class GetModifiedDayCarePriceDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @ApiProperty({ type: [BigInt] })
  @IsNotEmpty()
  @IsArray()
  petIds: bigint[];

  @ApiProperty()
  @IsNotEmpty()
  timing: TimingType;

  @ApiProperty()
  @IsNotEmpty()
  dates: object;

  @ApiProperty()
  @IsNotEmpty()
  timeZone: string;
}
