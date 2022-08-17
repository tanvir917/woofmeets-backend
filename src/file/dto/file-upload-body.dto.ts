import { ApiProperty } from '@nestjs/swagger';

export class FileUploadBody {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
