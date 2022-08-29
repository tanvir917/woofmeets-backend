import { Injectable } from '@nestjs/common';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrUpdatePetPreferenceDto } from './dto/create-update-pet-preference.dto';

@Injectable()
export class PetPreferenceService {
  constructor(private readonly prismaService: PrismaService) {}

  async createOrUpdate(
    userId: bigint,
    petPreference: CreateOrUpdatePetPreferenceDto,
  ) {
    const { petPerDay, smallDog, mediumDog, largeDog, giantDog, cat } =
      petPreference;

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    console.log(user);

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    const createOrUpdatedPetPreference =
      await this.prismaService.servicePetPreference.upsert({
        where: { providerId: user?.provider?.id },
        update: {
          petPerDay,
          smallDog,
          mediumDog,
          largeDog,
          giantDog,
          cat,
        },
        create: {
          providerId: user?.provider?.id,
          petPerDay,
          smallDog,
          mediumDog,
          largeDog,
          giantDog,
          cat,
        },
      });

    throwBadRequestErrorCheck(
      !createOrUpdatedPetPreference,
      'Pet preference could not be created or updated',
    );

    return {
      messaege: 'Pet preference created or updated successfully',
      data: createOrUpdatedPetPreference,
    };
  }

  async getPetPreference(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    const petPreference =
      await this.prismaService.servicePetPreference.findUnique({
        where: { providerId: user?.provider?.id },
      });

    throwBadRequestErrorCheck(!petPreference, 'Pet preference not found');

    return {
      messaege: 'Pet preference found successfully',
      data: petPreference,
    };
  }
}
