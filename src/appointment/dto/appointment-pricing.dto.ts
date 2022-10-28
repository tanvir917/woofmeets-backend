import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GetModifiedAppointmentPriceDTO {
  @ApiProperty()
  @IsNotEmpty()
  serviceId: number;

  @ApiProperty()
  @IsNotEmpty()
  petIds: any;

  @ApiProperty()
  @IsNotEmpty()
  timing: object;

  @ApiProperty()
  @IsNotEmpty()
  dates: object;

  @ApiProperty()
  @IsNotEmpty()
  timeZone: string;
}
