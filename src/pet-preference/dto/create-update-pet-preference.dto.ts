import { ApiProperty } from '@nestjs/swagger';

export class CreateOrUpdatePetPreferenceDto {
  @ApiProperty()
  petPerDay: number;

  @ApiProperty()
  smallDog: boolean;

  @ApiProperty()
  mediumDog: boolean;

  @ApiProperty()
  largeDog: boolean;

  @ApiProperty()
  giantDog: boolean;

  @ApiProperty()
  cat: boolean;
}
