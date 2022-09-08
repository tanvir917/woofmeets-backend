import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Onboarding Quiz')
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // TODO: Setup admin guard on each route except get all
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createQuizDto: CreateQuizDto) {
    return this.quizService.create(createQuizDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.quizService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
    const qid = BigInt(id) ?? BigInt(-1);
    return this.quizService.update(qid, updateQuizDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    const qid = BigInt(id) ?? BigInt(-1);
    return this.quizService.remove(qid);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/complete/:userId')
  @ApiOperation({
    summary:
      'Quiz on completation api. This API will update user quiz activity.',
  })
  quizComplete(@Request() req: any, @Param('userId') id: string) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    const uid = BigInt(id);
    if (userId !== uid) {
      throw new BadRequestException('User does not matched.');
    }
    return this.quizService.quizCompletation(userId);
  }
}
