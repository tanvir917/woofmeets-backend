import { Injectable } from '@nestjs/common';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserProfileService {
  constructor(private prismaService: PrismaService) {}

  async getCountry() {
    const country = await this.prismaService.country.findMany({
      where: { deletedAt: null },
    });

    throwNotFoundErrorCheck(
      !country || country?.length <= 0,
      'Country not found',
    );

    return {
      message: 'Country found successfully.',
      data: country,
    };
  }

  async getUserProfile(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        provider: {
          select: {
            id: true,
            havePets: true,
            quizPassed: true,
            photoSubmitted: true,
            backGroundCheck: true,
            providerDetails: true,
            isApproved: true,
            providerServices: {
              include: {
                serviceType: true,
              },
            },
          },
        },
        basicInfo: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found');

    return {
      message: 'User profile found',
      data: user,
    };
  }

  async getContactInfo(userId: bigint) {
    return {
      data: await this.prismaService.user.findUnique({
        where: { id: userId },
        select: {
          contact: true,
          emergencyContact: true,
        },
      }),
    };
  }
}
