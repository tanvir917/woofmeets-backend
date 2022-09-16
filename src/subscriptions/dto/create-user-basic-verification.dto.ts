import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserBasicVerificationDto {
  @ApiProperty()
  @IsNotEmpty()
  dob: Date;

  @IsString()
  @ApiProperty({ required: false })
  state: string;

  @IsString()
  @ApiProperty({ required: false })
  dlId: string;

  @IsString()
  @ApiProperty({ required: false })
  stateId: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  file: any[];
}
