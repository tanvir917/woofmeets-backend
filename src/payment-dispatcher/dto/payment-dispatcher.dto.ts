import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PaymentDispatcherBlockedDto {
  @ApiProperty({ required: false, description: 'Blocked' })
  @IsString()
  @IsOptional()
  lockedReason?: string;
}
