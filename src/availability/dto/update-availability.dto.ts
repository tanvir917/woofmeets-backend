import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiProperty()
  @IsBoolean()
  sat: boolean;

  @ApiProperty()
  @IsBoolean()
  sun: boolean;

  @ApiProperty()
  @IsBoolean()
  mon: boolean;

  @ApiProperty()
  @IsBoolean()
  tue: boolean;

  @ApiProperty()
  @IsBoolean()
  wed: boolean;

  @ApiProperty()
  @IsBoolean()
  thu: boolean;

  @ApiProperty()
  @IsBoolean()
  fri: boolean;
}
