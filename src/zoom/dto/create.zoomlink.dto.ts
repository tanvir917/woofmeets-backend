import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateZoomLinkDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  token?: string;
}
