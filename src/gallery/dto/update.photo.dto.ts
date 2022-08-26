import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GalleryPhotoUpdateBodyDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  caption?: string;
}
