import { ApiProperty } from '@nestjs/swagger';

export class GalleryPhotoUploadDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
