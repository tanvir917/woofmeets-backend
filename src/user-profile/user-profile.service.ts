import { HttpStatus, Injectable } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CheckHavePetDTo } from './dto/have-pets.dto';
import { UserOnboardingProgressService } from './user-onboarding-progress.service';

@Injectable()
export class UserProfileService {
  constructor(
    private prismaService: PrismaService,
    private userOnboardingProgressService: UserOnboardingProgressService,
    private emailService: EmailService,
  ) {}

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
            profileSubmitted: true,
            providerServices: {
              include: {
                serviceType: true,
              },
            },
          },
        },
        basicInfo: true,
        contact: true,
        emergencyContact: true,
        Gallery: true,
        pet: true,
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

  async checkProfileHavePet(userId: bigint, checkHavePetDTo: CheckHavePetDTo) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: {
          select: {
            id: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');
    throwBadRequestErrorCheck(!user?.provider, 'Provider not found.');

    const { havePets } = checkHavePetDTo;

    const provider = await this.prismaService.provider.update({
      where: {
        id: user?.provider?.id,
      },
      data: {
        havePets,
      },
    });

    return {
      message: 'Provider have pets updated successfully.',
      data: provider,
    };
  }

  async submitOnboardingProcess(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    throwBadRequestErrorCheck(
      user?.provider?.profileSubmitted,
      'Onboarding already submitted.',
    );

    const onboarding =
      await this.userOnboardingProgressService.getUserOnboardingProgress(
        user?.id,
      );

    if (
      !onboarding?.serviceSelection ||
      !onboarding?.serviceSetup ||
      !onboarding?.profileSetup ||
      !onboarding?.safetyQuiz ||
      !onboarding?.subscription
    ) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Onboarding process is not completed.',
        data: onboarding,
      };
    }

    const providerProfileSubmitted = await this.prismaService.provider.update({
      where: {
        id: user?.provider?.id,
      },
      data: {
        profileSubmitted: true,
      },
    });

    throwBadRequestErrorCheck(
      !providerProfileSubmitted,
      'Provider onboarding process can not be submitted. Please try again later.',
    );

    await this.emailService.completeOnBoardingEmail(user?.email);

    return {
      message: 'Provider onboarding process submitted successfully.',
      data: providerProfileSubmitted,
    };
  }
}
