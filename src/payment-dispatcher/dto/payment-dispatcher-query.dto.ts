import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaymentDispatcherQueryDto {
  @ApiProperty({ required: false, default: 1, description: 'Page #' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    default: 50,
    description: 'Item limit per page',
  })
  @IsNumber()
  @IsOptional()
  limit: number;

  @ApiProperty({
    required: false,
    default: 'createdAt',
    description: 'By which the items would be sorted.',
  })
  @IsString()
  @IsOptional()
  sortBy: string;

  @ApiProperty({
    required: false,
    default: 'desc',
    description: 'Order of the sorted items',
  })
  @IsString()
  @IsOptional()
  sortOrder: string;
}