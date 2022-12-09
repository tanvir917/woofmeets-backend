import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { CreatePetReviewDto } from './dto/create-pet-review.dto';
import { PetReviewService } from './pet-review.service';

@Controller('pet-review')
export class PetReviewController {
  constructor(private readonly petReviewService: PetReviewService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({ type: CreatePetReviewDto })
  @Post()
  async create(
    @Body() createPetReviewDto: CreatePetReviewDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.petReviewService.create(userId, createPetReviewDto);
  }

  @Get()
  async findAll() {
    return this.petReviewService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid pet review id. Please, try again after sometime with valid pet review id.',
    );
    return this.petReviewService.findOne(userId, +id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/pet/:petId')
  async findReviewByPetId(@Param('petId') petId: string, @Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !petId || petId == undefined,
      'Invalid pet id. Please, try again after sometime with valid petId.',
    );
    return this.petReviewService.findReviewByPetId(userId, +petId);
  }
}
