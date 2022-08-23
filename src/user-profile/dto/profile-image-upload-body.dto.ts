import { ApiProperty } from '@nestjs/swagger';

export class ProfileImageUploadBodyDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
