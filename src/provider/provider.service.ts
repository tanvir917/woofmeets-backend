import { Injectable } from '@nestjs/common';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { latlongDistanceCalculator } from 'src/utils/tools';

@Injectable()
export class ProviderService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProviderDetails(viewerOpk: string, providerOpk: string) {
    const viewerUser = await this.prismaService.user.findFirst({
      where: {
        opk: viewerOpk,
        deletedAt: null,
      },
      select: {
        basicInfo: {
          select: {
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    const providerUser = await this.prismaService.user.findFirst({
      where: {
        opk: providerOpk,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        basicInfo: true,
        contact: true,
        provider: {
          include: {
            providerDetails: true,
            HomeAttributes: {
              where: { deletedAt: null },
              include: {
                homeAttributeType: true,
              },
            },
            providerServices: {
              where: {
                deletedAt: null,
              },
              include: {
                ServiceHasRates: {
                  include: {
                    serviceTypeRate: {
                      include: {
                        serviceRateType: true,
                      },
                    },
                  },
                },
                serviceType: true,
              },
            },
            ServicePetPreference: true,
          },
        },
        Gallery: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            imageSrc: true,
            sequence: true,
            caption: true,
            meta: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(!providerUser, 'Provider not found.');

    return {
      message: 'Provider details found successfully',
      data: {
        galleryPhotos: providerUser?.Gallery,
        provider: {
          firstName: providerUser?.firstName,
          lastName: providerUser?.lastName,
          email: providerUser?.email,
          avatar: providerUser?.image,
          rating: null,
          description: providerUser?.provider?.providerDetails?.headline,
          address: providerUser?.basicInfo,
          latitude: providerUser?.basicInfo?.latitude,
          longitude: providerUser?.basicInfo?.longitude,
          contact: providerUser?.contact,
          badge: null,
        },
        services: providerUser?.provider?.providerServices,
        canHost: providerUser?.provider?.ServicePetPreference,
        atHome: providerUser?.provider?.ServicePetPreference,
        overview: {
          featured: {
            distance:
              viewerUser?.basicInfo?.latitude &&
              viewerUser?.basicInfo?.longitude &&
              providerUser?.basicInfo?.latitude &&
              providerUser?.basicInfo?.longitude
                ? latlongDistanceCalculator(
                    providerUser?.basicInfo?.latitude,
                    providerUser?.basicInfo?.longitude,
                    viewerUser?.basicInfo?.latitude,
                    viewerUser?.basicInfo?.longitude,
                  )
                : null,
            experience:
              providerUser?.provider?.providerDetails?.yearsOfExperience,
            petHandled: null,
            reviewsCount: null,
          },
          about: null,
          skills: [],
          sittersHome: {
            homeType: providerUser?.provider?.homeType,
            yardType: providerUser?.provider?.yardType,
            homeAttributes: providerUser?.provider?.HomeAttributes,
          },
          pastCLients: [],
        },
        reviews: [],
        recomendedSitters: [],
      },
    };
  }
}
