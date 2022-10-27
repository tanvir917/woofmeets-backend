import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  cancelReason?: string;
}
