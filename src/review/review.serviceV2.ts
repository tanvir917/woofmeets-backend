import { Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDtoV2 } from './dto/create-reviewV2.dto';

@Injectable()
export class ReviewServiceV2 {
  constructor(private prismaService: PrismaService) {}
  async createV2(userId: bigint, createReviewDtoV2: CreateReviewDtoV2) {
    const {
      appointmentId,
      comment,
      rating,
      providerServiceRating,
      providerServiceComment,
      petsReview,
    } = createReviewDtoV2;

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
      'User does not have permission to review.',
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

    const promises = [];

    for (let i = 0; i < petsReview?.length; i++) {
      promises.push(
        await this.prismaService.petReview.create({
          data: {
            userId: appointment?.provider?.user?.id,
            petId: petsReview[i]?.petId,
            providerId: appointment.provider?.id,
            appointmentId: appointment?.id,
            rating,
            comment,
          },
        }),
      );
    }

    await Promise.allSettled(promises);

    return {
      message: 'Review created successfully.',
      data: review,
    };
  }
}
