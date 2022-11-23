import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AppointmentStartDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  startTime?: string;
}

export class AppointmentStopDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  stopTime?: string;
}
