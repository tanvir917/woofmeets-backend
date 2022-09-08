import { Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

@Injectable()
export class QuizService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(body: CreateQuizDto) {
    const data = await this.prismaService.quiz.create({
      data: {
        question: body.question,
        answer: body.answer,
        options: body.options,
      },
    });

    return { data };
  }

  async findAll() {
    const data = await this.prismaService.quiz.findMany({
      where: {
        active: true,
        deletedAt: null,
      },
    });
    throwNotFoundErrorCheck(data?.length === 0, 'Quiz not found.');
    return { data };
  }

  async update(id: bigint, body: UpdateQuizDto) {
    const quiz = await this.prismaService.quiz.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(!quiz, 'Quiz not found.');

    const data = await this.prismaService.quiz.update({
      where: {
        id,
      },
      data: {
        ...body,
      },
    });
    return { data };
  }

  async remove(id: bigint) {
    const quiz = await this.prismaService.quiz.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(!quiz, 'Quiz not found.');

    await this.prismaService.quiz.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date().toISOString(),
      },
    });
    return { message: 'Quiz deleted successfully.' };
  }

  async quizCompletation(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { provider: true },
    });

    throwBadRequestErrorCheck(!user, 'User not found');
    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    await this.prismaService.provider.update({
      where: { id: user?.provider.id },
      data: {
        quizPassed: true,
      },
    });

    return {
      message: 'Quiz status updated.',
    };
  }
}
