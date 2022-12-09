import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetBalancesQueryDto {
  @ApiProperty({ required: false, default: 1, description: 'Page #' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    default: 20,
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

  @ApiProperty({
    required: false,
    description:
      'Status of the payment. (succeeded, pending, failed, canceled)',
  })
  @IsString()
  @IsOptional()
  status: string;
}
