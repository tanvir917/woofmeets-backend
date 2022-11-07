import { ApiProperty } from '@nestjs/swagger';

export class UpdateMultipleServiceRateDto {
  @ApiProperty()
  ratesToUpdate: any;

  @ApiProperty()
  ratesToAdd: any;
}
