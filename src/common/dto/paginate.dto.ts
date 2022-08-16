import { ApiProperty } from '@nestjs/swagger';

export class PaginateQueryDto {
  @ApiProperty({ required: false, default: 1, description: 'Page #' })
  page?: number;

  @ApiProperty({
    required: false,
    default: 20,
    description: 'Item limit per page',
  })
  limit: number;
}
