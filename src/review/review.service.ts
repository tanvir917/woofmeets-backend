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
    const {
      appointmentId,
      comment,
      rating,
      providerServiceRating,
      providerServiceComment,
    } = createReviewDto;

    const [user, appointment] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
        include: {
          provider: true,
        },
      }),
      this.prismaService.appointment.findFirst({
        where: {
          id: appointmentId,
          deletedAt: null,
        },
        include: {
          provider: {
            include: {
              user: true,
            },
          },
        },
      }),
    ]);

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    throwNotFoundErrorCheck(
      !user ||
        (appointment?.userId != userId &&
          appointment?.providerId != user?.provider?.id),
      'User not found.',
    );

    /*
    TODO: 
    * Appointment endof life check.
    * Appointment status check.
    */

    const reviewedById =
      appointment?.userId == userId ? userId : appointment?.provider?.user?.id;

    const pastReviewCheck = await this.prismaService.review.findFirst({
      where: {
        appointmentId,
        reviewedById,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!!pastReviewCheck, 'Already review given.');

    const review = await this.prismaService.review.create({
      data: {
        reviewedById: userId,
        reviewedForId:
          appointment?.userId == userId
            ? appointment?.provider?.user?.id
            : appointment?.userId,
        appointmentId: appointment?.id,
        rating,
        comment,
        providerServiceId: providerServiceRating
          ? appointment?.providerServiceId
          : null,
        providerServiceRating,
        providerServiceComment,
      },
    });

    throwBadRequestErrorCheck(!review, 'Review not created');

    return {
      message: 'Review created successfully.',
      data: review,
    };
  }
}
