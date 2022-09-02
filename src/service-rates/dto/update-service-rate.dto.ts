import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceRateDto {
  @ApiProperty()
  amount: number;
}
