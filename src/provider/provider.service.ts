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
        basicInfo: {
          include: {
            country: true,
          },
        },
        contact: true,
        provider: {
          include: {
            providerDetails: true,
            providerSkills: {
              where: {
                deletedAt: null,
              },
              include: {
                skillType: true,
              },
            },
            HomeAttributes: {
              where: { deletedAt: null },
              include: {
                homeAttributeType: true,
              },
            },
            providerServices: {
              where: {
                isApproved: true,
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
            review: {
              where: {
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
            },
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

    const reviewStatistics = await this.prismaService.review.aggregate({
      where: {
        providerId: providerUser?.id,
        deletedAt: null,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      message: 'Provider details found successfully',
      data: {
        galleryPhotos: providerUser?.Gallery,
        provider: {
          firstName: providerUser?.firstName,
          lastName: providerUser?.lastName,
          email: providerUser?.email,
          avatar: providerUser?.image,
          rating: {
            average: reviewStatistics?._avg?.rating
              ? Number(reviewStatistics?._avg?.rating?.toFixed(1))
              : 0,
            totalCount: reviewStatistics?._count?.id ?? 0,
          },
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
          about: providerUser?.provider?.providerDetails?.about,
          skills: providerUser?.provider?.providerSkills,
          sittersHome: {
            homeType: providerUser?.provider?.homeType,
            yardType: providerUser?.provider?.yardType,
            homeAttributes: providerUser?.provider?.HomeAttributes,
          },
          pastCLients: [],
        },
        reviews: providerUser?.provider?.review,
        recomendedSitters: [],
      },
    };
  }
}
