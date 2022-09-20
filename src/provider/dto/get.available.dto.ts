import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class GetAvailableCalenderDto {
  @ApiProperty({ example: new Date().toISOString() })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: 20 })
  @IsNotEmpty()
  @IsNumber()
  range: number;
}
