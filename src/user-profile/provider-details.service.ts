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
      about,
      skills,
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
      'User already has provider details. Please update instead',
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
        detailsSubmitted: true,
        about,
      },
    });

    throwBadRequestErrorCheck(!providerDetails, 'Provider details not created');

    throwBadRequestErrorCheck(!skills?.length, 'Skills not provided');

    await this.prismaService.providerSkills.createMany({
      data: skills.map((skill) => ({
        providerId: user?.provider?.id,
        skillTypeId: BigInt(skill),
      })),
    });

    const providerSkills = await this.prismaService.providerSkills.findMany({
      where: { providerId: user?.provider?.id, deletedAt: null },
      include: {
        skillType: true,
      },
    });

    return {
      message: 'Provider details created',
      data: { providerDetails, providerSkills },
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
            providerSkills: {
              where: {
                deletedAt: null,
              },
              include: {
                skillType: true,
              },
            },
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
      data: {
        providerDetails: user?.provider?.providerDetails,
        providerSkills: user?.provider?.providerSkills,
      },
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
      about,
      skills,
    } = updateProviderDetailsDto;

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: {
          select: {
            id: true,
            providerDetails: true,
            providerSkills: {
              where: {
                skillTypeId: {
                  in: skills,
                },
              },
            },
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
        detailsSubmitted: true,
        about,
      },
    });

    throwBadRequestErrorCheck(!providerDetails, 'Provider details not updated');

    await this.prismaService.providerSkills.updateMany({
      where: {
        skillTypeId: {
          notIn: skills,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const newSkills = [];

    const mappedPreviousProviderSkills = user?.provider?.providerSkills?.map(
      (item) => {
        return Number(item?.skillTypeId);
      },
    );

    skills.forEach((skill) => {
      if (!mappedPreviousProviderSkills?.includes(skill)) {
        newSkills.push(skill);
      }
    });

    console.log(newSkills);

    if (newSkills?.length) {
      await this.prismaService.providerSkills.createMany({
        data: newSkills.map((skill) => ({
          providerId: user?.provider?.id,
          skillTypeId: BigInt(skill),
        })),
      });
    }

    const providerSkills = await this.prismaService.providerSkills.findMany({
      where: { providerId: user?.provider?.id, deletedAt: null },
      include: {
        skillType: true,
      },
    });

    return {
      message: 'Provider details updated',
      data: { providerDetails, providerSkills },
    };
  }

  async providerProfileSkillTypes() {
    const skillTypes = await this.prismaService.profileSkillType.findMany({
      where: { deletedAt: null, active: true },
    });

    throwBadRequestErrorCheck(!skillTypes, 'Skill types not found');

    return {
      message: 'Skill types found',
      data: skillTypes,
    };
  }
}
