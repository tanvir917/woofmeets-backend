import { ApiProperty } from '@nestjs/swagger';

export class CreateBasicInfoDto {
  @ApiProperty()
  dob: Date;

  @ApiProperty()
  addressLine1: string;

  @ApiProperty({
    required: false,
  })
  addressLine2: string;

  @ApiProperty({
    required: false,
  })
  street: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;

  @ApiProperty()
  countryId: number;

  @ApiProperty({
    required: false,
    default: 0.0,
  })
  latitude: number;

  @ApiProperty({
    required: false,
    default: 0.0,
  })
  longitude: number;

  @ApiProperty({
    required: false,
  })
  meta?: JSON;
}
