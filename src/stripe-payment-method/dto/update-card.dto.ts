import { ApiProperty } from '@nestjs/swagger';

export class UpdateCardDto {
  @ApiProperty()
  expMonth: string;

  @ApiProperty()
  expYear: string;
}
