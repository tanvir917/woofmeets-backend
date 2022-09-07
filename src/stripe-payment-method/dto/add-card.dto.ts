import { ApiProperty } from '@nestjs/swagger';

export class CreateTokenDto {
  @ApiProperty()
  number: string;

  @ApiProperty()
  exp_month: string;

  @ApiProperty()
  exp_year: string;

  @ApiProperty()
  cvc: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address_city: string;

  @ApiProperty()
  address_country: string;

  @ApiProperty()
  address_line1: string;

  @ApiProperty()
  address_state: string;

  @ApiProperty()
  address_zip: string;
}

export class AddCardDto {
  @ApiProperty()
  customerId: string;

  @ApiProperty()
  countryId: number;

  @ApiProperty()
  token: string;
}
