import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserApplicationVersionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty()
  @IsOptional()
  meta: object;
}
