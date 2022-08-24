import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateNewsletterDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
