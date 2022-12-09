import { PartialType } from '@nestjs/swagger';
import { CreatePetReviewDto } from './create-pet-review.dto';

export class UpdatePetReviewDto extends PartialType(CreatePetReviewDto) {}
