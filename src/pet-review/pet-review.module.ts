import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PetReviewController } from './pet-review.controller';
import { PetReviewService } from './pet-review.service';

@Module({
  imports: [PrismaModule],
  controllers: [PetReviewController],
  providers: [PetReviewService],
})
export class PetReviewModule {}
