import { Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(private prismaService: PrismaService) {}
  async create(userId: bigint, createReviewDto: CreateReviewDto) {
    const { appointmentId, comment, rating } = createReviewDto;

    const [user, appointment] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
      }),
      this.prismaService.appointment.findFirst({
        where: {
          id: appointmentId,
          deletedAt: null,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    throwBadRequestErrorCheck(userId != appointment?.userId, 'Wrong user id!');
    throwBadRequestErrorCheck(
      userId == appointment?.providerId,
      'Provider can not give review on own appointment.',
    );

    /*
    TODO: 
    * Appointment endof life check.
    * Appointment status check.
    */

    const pastReviewCheck = await this.prismaService.review.findFirst({
      where: {
        appointmentId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!!pastReviewCheck, 'Already review given.');

    const review = await this.prismaService.review.create({
      data: {
        userId,
        providerId: appointment?.providerId,
        appointmentId: appointment?.id,
        rating,
        comment,
      },
    });

    throwBadRequestErrorCheck(!review, 'Review not created');

    return {
      message: 'Review created successfully.',
      data: review,
    };
  }
}
