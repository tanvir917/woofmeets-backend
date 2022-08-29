import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GalleryPhotosDragDropDto {
  @ApiProperty()
  @IsNotEmpty()
  photos: any;
}
