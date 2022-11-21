import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NewMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  opk: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;
}
