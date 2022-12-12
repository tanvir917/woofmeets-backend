import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateReviewDtoV2 } from './dto/create-reviewV2.dto';
import { ReviewService } from './review.service';
import { ReviewServiceV2 } from './review.serviceV2';

@ApiTags('Review')
@Controller('review')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly reviewServiceV2: ReviewServiceV2,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateReviewDto })
  @Post()
  async create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.reviewService.create(userId, createReviewDto);
  }

  @Version('2')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreateReviewDtoV2 })
  @Post()
  async createV2(
    @Body() createReviewDtoV2: CreateReviewDtoV2,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.reviewServiceV2.createV2(userId, createReviewDtoV2);
  }
}
