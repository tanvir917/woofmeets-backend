import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceRateDto {
  @ApiProperty()
  serviceId: number;

  @ApiProperty()
  rateId: number;

  @ApiProperty()
  amount: number;
}
