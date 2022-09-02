import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceTypeRateDto {
  @ApiProperty()
  serviceTypeId: number;

  @ApiProperty()
  rateTypeId: number;
}
