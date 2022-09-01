import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @MinLength(6)
  @IsNotEmpty()
  @ApiProperty()
  password: string;

  @MinLength(6)
  @IsNotEmpty()
  @ApiProperty()
  newPassword: string;
}
