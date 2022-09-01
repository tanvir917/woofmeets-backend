import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class UpdatePasswordOtpToken {
  @MinLength(6)
  @IsNotEmpty()
  @ApiProperty()
  password: string;
}
