import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GalleryPhotoUpdateDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  caption?: string;
}
