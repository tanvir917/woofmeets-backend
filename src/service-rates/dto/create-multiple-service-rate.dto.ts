import { ApiProperty } from '@nestjs/swagger';

export class CreateMultipleServiceRateDto {
  @ApiProperty()
  serviceRate: any;
}
