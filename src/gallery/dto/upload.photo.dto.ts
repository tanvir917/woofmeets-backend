import { ApiProperty } from '@nestjs/swagger';

export class GalleryPhotoUploadBodyDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
