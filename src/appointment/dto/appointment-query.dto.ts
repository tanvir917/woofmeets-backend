import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AppointmentListsQueryParamsDto {
  @ApiProperty({ required: false, default: 1, description: 'Page #' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    default: 20,
    description: 'Item limit per page. Default is 20',
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
