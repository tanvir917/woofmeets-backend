import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AppleSignUpDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  appleToken: string;
}
