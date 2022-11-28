import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateBasicPaymentInfoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
