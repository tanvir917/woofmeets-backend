import { ApiProperty } from '@nestjs/swagger';

export class SuccessfulUploadObject {
  @ApiProperty()
  ETag: string;
  @ApiProperty()
  Location: string;
  @ApiProperty()
  key: string;
  @ApiProperty()
  Key: string;
  @ApiProperty()
  Bucket?: string;
  @ApiProperty()
  MimeType: string;
}
