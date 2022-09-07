import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateAvailabilityDto {
  @ApiProperty()
  @IsNotEmpty()
  providerServiceId: number;

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

  @ApiProperty()
  @IsString()
  pottyBreak: string;

  @ApiProperty()
  @IsBoolean()
  fulltime: boolean;
}
