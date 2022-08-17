import { ApiProperty } from '@nestjs/swagger';

export class RawUploadFormFile {
  @ApiProperty({
    description: 'Original name of the uploaded file',
  })
  originalname: string;
  @ApiProperty({
    description: 'File Encoding',
  })
  encoding: string;
  @ApiProperty({
    description: 'Mimetype of files',
  })
  mimetype: string;
  @ApiProperty({
    description: 'Target field',
  })
  fieldname: string;
  @ApiProperty({
    description: 'Files size',
  })
  size: string;
  @ApiProperty({
    description: 'File Buffer',
  })
  buffer: Buffer;
}
