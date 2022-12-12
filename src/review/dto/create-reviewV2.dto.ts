import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDtoV2 {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  appointmentId: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  providerServiceRating: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  providerServiceComment?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  petsReview?: any;
}
