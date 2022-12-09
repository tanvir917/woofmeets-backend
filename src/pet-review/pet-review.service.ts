import { Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePetReviewDto } from './dto/create-pet-review.dto';

@Injectable()
export class PetReviewService {
  constructor(private prismaService: PrismaService) {}

  async create(userId: bigint, createPetReviewDto: CreatePetReviewDto) {
    const { appointmentId, petId, comment, rating } = createPetReviewDto;

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
      !user || appointment?.providerId != user?.provider?.id,
      'User not found.',
    );

    const pastPetReviewCheck = await this.prismaService.petReview.findFirst({
      where: {
        appointmentId,
        petId,
        userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(
      !!pastPetReviewCheck,
      'Already pet review given.',
    );

    const petReview = await this.prismaService.petReview.create({
      data: {
        userId,
        petId,
        providerId: user?.provider?.id,
        appointmentId,
        rating,
        comment,
      },
    });

    throwBadRequestErrorCheck(!petReview, 'Pet review not created');

    return {
      message: 'Pet review created successfully.',
      data: petReview,
    };
  }

  async findAll() {
    const petReviews = await this.prismaService.petReview.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        pet: true,
        user: {
          select: {
            id: true,
            opk: true,
            email: true,
            firstName: true,
            lastName: true,
            image: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(petReviews?.length <= 0, 'Pet reviews not found.');

    return {
      message: 'Pet reviews found successfully',
      data: petReviews,
    };
  }

  async findOne(userId: bigint, id: number) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    const petReview = await this.prismaService.petReview.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            opk: true,
            email: true,
            emailVerified: true,
            firstName: true,
            lastName: true,
            zipcode: true,
            image: true,
            timezone: true,
            meta: true,
            basicInfo: {
              select: {
                country: true,
              },
            },
          },
        },
      },
    });

    throwNotFoundErrorCheck(!petReview, 'Pet review not found.');

    return {
      message: 'Pet review found successfully.',
      data: petReview,
    };
  }

  async findReviewByPetId(userId: bigint, petId: number) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    const [reviewStatistics, petReviews] =
      await this.prismaService.$transaction([
        this.prismaService.petReview.aggregate({
          where: {
            petId,
            deletedAt: null,
          },
          _avg: {
            rating: true,
          },
          _count: {
            id: true,
          },
        }),
        this.prismaService.petReview.findMany({
          where: {
            petId,
            deletedAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                opk: true,
                email: true,
                emailVerified: true,
                firstName: true,
                lastName: true,
                zipcode: true,
                image: true,
                timezone: true,
                meta: true,
                basicInfo: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        }),
      ]);

    throwNotFoundErrorCheck(petReviews?.length <= 0, 'Pet reviews not found.');

    return {
      message: 'Pet review found successfully.',
      data: {
        rating: {
          average: reviewStatistics?._avg?.rating
            ? Math.round(Number(reviewStatistics?._avg?.rating?.toFixed(1)))
            : 0,
          totalCount: reviewStatistics?._count?.id ?? 0,
        },
        petReviews,
      },
    };
  }
}
