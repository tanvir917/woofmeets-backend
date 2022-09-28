import { ApiProperty } from '@nestjs/swagger';

export class PostMessageDto {
  @ApiProperty({ required: false })
  message?: string;
}
