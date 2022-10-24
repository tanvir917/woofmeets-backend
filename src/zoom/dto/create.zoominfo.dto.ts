import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateZoomInfoDto {
  // @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  // refreshToken: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  zoomCode: string;
}
