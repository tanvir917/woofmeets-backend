import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTimezoneDTo {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  timezone: string;
}
