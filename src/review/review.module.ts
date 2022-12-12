import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewServiceV2 } from './review.serviceV2';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewController],
  providers: [ReviewService, ReviewServiceV2],
})
export class ReviewModule {}
