import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserBasicVerificationDto {
  @ApiProperty({ description: 'Example: 1992-09-21T00:00:00.000Z' })
  @IsNotEmpty()
  dob: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  state?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  dlId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  stateId?: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  file: any[];
}
