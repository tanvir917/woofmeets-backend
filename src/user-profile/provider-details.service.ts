import { Injectable } from '@nestjs/common';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProviderDetailsDto } from './dto/create-provider-details.dto';
import { UpdateProviderDetailsDto } from './dto/update-provider-details.dto';

@Injectable()
export class ProviderDetailsService {
  constructor(private prismaService: PrismaService) {}

  async createProviderDetails(
    userId: bigint,
    createProviderDetailsDto: CreateProviderDetailsDto,
  ) {
    const {
      headline,
      dogsExperience,
      environmentDescription,
      experienceDescription,
      requestedDogInfo,
      scheduleDescription,
      walkingExperience,
      yearsOfExperience,
    } = createProviderDetailsDto;

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: {
          select: {
            id: true,
            providerDetails: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user?.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !!user?.provider?.providerDetails,
      'User asleady has provider details. Please update instead',
    );

    const providerDetails = await this.prismaService.providerDetails.create({
      data: {
        providerId: user?.provider?.id,
        headline,
        dogsExperience,
        environmentDescription,
        experienceDescription,
        requestedDogInfo,
        scheduleDescription,
        walkingExperience,
        yearsOfExperience,
      },
    });

    throwBadRequestErrorCheck(!providerDetails, 'Provider details not created');

    return {
      message: 'Provider details created',
      data: providerDetails,
    };
  }

  async getProviderDetails(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: {
          select: {
            id: true,
            providerDetails: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user?.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !user?.provider?.providerDetails,
      'User does not have provider details.',
    );

    return {
      message: 'Provider details found',
      data: user?.provider?.providerDetails,
    };
  }

  async updateProviderDetails(
    userId: bigint,
    updateProviderDetailsDto: UpdateProviderDetailsDto,
  ) {
    const {
      headline,
      dogsExperience,
      environmentDescription,
      experienceDescription,
      requestedDogInfo,
      scheduleDescription,
      walkingExperience,
      yearsOfExperience,
    } = updateProviderDetailsDto;

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: {
          select: {
            id: true,
            providerDetails: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user?.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !user?.provider?.providerDetails,
      'User does not have provider details.',
    );

    const providerDetails = await this.prismaService.providerDetails.update({
      where: { id: user?.provider?.providerDetails?.id },
      data: {
        headline,
        dogsExperience,
        environmentDescription,
        experienceDescription,
        requestedDogInfo,
        scheduleDescription,
        walkingExperience,
        yearsOfExperience,
      },
    });

    throwBadRequestErrorCheck(!providerDetails, 'Provider details not updated');

    return {
      message: 'Provider details updated',
      data: providerDetails,
    };
  }
}
