import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';

export class GetAvailableCalenderDto {
  @ApiProperty({ example: new Date().toISOString() })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: new Date().toISOString() })
  @IsOptional()
  @IsDateString()
  endDate: string;
}
