import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class CreateMembershipPlanPricesDto {
  @ApiProperty()
  @IsNumber()
  rate: number;

  @ApiProperty({ required: false, description: 'Rate after discount.' })
  @IsNumber()
  @IsOptional()
  cropRate?: number;

  @ApiProperty({
    maximum: 12,
    minimum: 1,
    required: true,
    type: 'integer',
    description:
      'Number of months subscription is valid for. After this period, the subscription will be renewed automatically.',
  })
  @IsNumber()
  validity: number;

  @ApiProperty({ required: false })
  meta?: object;
}
