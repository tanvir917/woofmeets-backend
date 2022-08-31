import { Injectable } from '@nestjs/common';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderHomeDto } from './dto/create-provider-home.dto';
import { HomeTypeEnum, YardTypeEnum } from './entities/provider-home.entity';

@Injectable()
export class ProviderHomeService {
  constructor(private prismaService: PrismaService) {}

  async createOrUpdate(
    userId: bigint,
    createProviderHomeDto: CreateProviderHomeDto,
  ) {
    const { homeType, yardType, homeAttributes } = createProviderHomeDto;

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { provider: true },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    const providerUpdate = await this.prismaService.provider.update({
      where: { id: user?.provider.id },
      data: {
        homeType: HomeTypeEnum[homeType],
        yardType: YardTypeEnum[yardType],
      },
    });

    //remove home attributes that are not in the list
    await this.prismaService.homeAttributes.updateMany({
      where: {
        AND: [
          { providerId: user?.provider.id },
          { homeAttributeTypeId: { notIn: homeAttributes } },
        ],
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const getHomeAttributes = await this.prismaService.homeAttributes.findMany({
      where: {
        providerId: user?.provider.id,
        homeAttributeTypeId: { in: homeAttributes },
        deletedAt: null,
      },
      select: { id: true },
    });

    const mappedPreviousHomeAttributesId = getHomeAttributes.map((item) => {
      return Number(item.id);
    });

    // add home attributes that are new
    const newHomeAttributes = homeAttributes.map((item) => {
      if (!mappedPreviousHomeAttributesId.includes(item)) {
        return {
          providerId: user?.provider.id,
          homeAttributeTypeId: item,
        };
      }
    });

    const addedHomeAttributes =
      await this.prismaService.homeAttributes.createMany({
        data: newHomeAttributes,
      });

    if (providerUpdate || addedHomeAttributes) {
      const providerHome = await this.prismaService.provider.findFirst({
        where: { id: user?.provider.id },
        select: {
          id: true,
          homeType: true,
          yardType: true,
          HomeAttributes: {
            where: { deletedAt: null },
            include: {
              homeAttributeType: true,
            },
          },
        },
      });
      return {
        message: 'Provider home created or updated successfully',
        data: providerHome,
      };
    }

    throwBadRequestErrorCheck(true, 'Provider home not created or updated');
  }

  async getHomeInfo(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { provider: true },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    const providerHome = await this.prismaService.provider.findFirst({
      where: { id: user?.provider.id },
      select: {
        id: true,
        homeType: true,
        yardType: true,
        HomeAttributes: {
          where: { deletedAt: null },
          include: {
            homeAttributeType: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!providerHome, 'Provider home not found');
    return {
      message: 'Provider home found successfully',
      data: providerHome,
    };
  }

  async getHomeAttributes() {
    const homeAttributesTypes =
      await this.prismaService.homeAttributeTitle.findMany({
        where: { deletedAt: null },
        include: {
          homeAttributeType: true,
        },
      });

    throwBadRequestErrorCheck(
      !homeAttributesTypes,
      'Home attributes not found',
    );

    return {
      message: 'Home attributes found successfully',
      data: homeAttributesTypes,
    };
  }
}
