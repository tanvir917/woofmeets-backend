import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewService } from './review.service';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateReviewDto })
  @Post()
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.reviewService.create(userId, createReviewDto);
  }
}
