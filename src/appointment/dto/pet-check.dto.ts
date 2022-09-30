import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class PetsCheckDto {
  @ApiProperty()
  @IsNotEmpty()
  providerId: number;

  @ApiProperty()
  @IsNotEmpty()
  petsId: any;
}
