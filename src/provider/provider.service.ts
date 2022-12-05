import { Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
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
        timezone: true,
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
                isActive: true,
                deletedAt: null,
              },
              include: {
                providerServiceReview: {
                  select: {
                    id: true,
                    reviewedById: true,
                    reviewedForId: true,
                    providerServiceId: true,
                    providerServiceRating: true,
                    providerServiceComment: true,
                    createdAt: true,
                    reviewedByIdUser: {
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

    const [reviews, reviewStatistics] = await this.prismaService.$transaction([
      this.prismaService.review.findMany({
        where: {
          reviewedForId: providerUser?.id,
          deletedAt: null,
        },
        select: {
          id: true,
          reviewedById: true,
          reviewedForId: true,
          rating: true,
          comment: true,
          createdAt: true,
          reviewedByIdUser: {
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
      this.prismaService.review.aggregate({
        where: {
          reviewedForId: providerUser?.id,
          deletedAt: null,
        },
        _avg: {
          rating: true,
        },
        _count: {
          id: true,
        },
      }),
    ]);

    const petHandled = await this.prismaService.appointmentPet.count({
      where: {
        appointment: {
          providerId: providerUser?.provider?.id,
          status: 'COMPLETED',
          deletedAt: null,
        },
      },
    });

    const services = providerUser?.provider?.providerServices?.filter(
      (item) => {
        if (item?.ServiceHasRates?.length > 0) {
          return item;
        }
      },
    );

    return {
      message: 'Provider details found successfully',
      data: {
        galleryPhotos: providerUser?.Gallery,
        provider: {
          firstName: providerUser?.firstName,
          lastName: providerUser?.lastName,
          email: providerUser?.email,
          avatar: providerUser?.image,
          timezone: providerUser?.timezone,
          country: providerUser?.basicInfo?.country ?? null,
          rating: {
            average: reviewStatistics?._avg?.rating
              ? Math.round(Number(reviewStatistics?._avg?.rating?.toFixed(1)))
              : 0,
            totalCount: reviewStatistics?._count?.id ?? 0,
          },
          description: providerUser?.provider?.providerDetails?.headline,
          providerDetails: providerUser?.provider?.providerDetails,
          address: providerUser?.basicInfo,
          latitude: providerUser?.basicInfo?.latitude,
          longitude: providerUser?.basicInfo?.longitude,
          contact: providerUser?.contact,
          badge: null,
        },
        services,
        canHost: providerUser?.provider?.ServicePetPreference,
        atHome: providerUser?.provider?.ServicePetPreference,
        overview: {
          featured: {
            distance:
              viewerUser?.basicInfo?.latitude &&
              viewerUser?.basicInfo?.longitude &&
              providerUser?.basicInfo?.latitude &&
              providerUser?.basicInfo?.longitude
                ? Number(
                    (
                      latlongDistanceCalculator(
                        providerUser?.basicInfo?.latitude,
                        providerUser?.basicInfo?.longitude,
                        viewerUser?.basicInfo?.latitude,
                        viewerUser?.basicInfo?.longitude,
                      ) * 0.62137
                    ).toFixed(2),
                  )
                : null,
            experience:
              providerUser?.provider?.providerDetails?.yearsOfExperience,
            petHandled,
            reviewsCount: reviewStatistics?._count?.id ?? 0,
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
        reviews,
        recomendedSitters: [],
      },
    };
  }

  async getUnavailability(opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: {
        opk,
        deletedAt: null,
      },
      include: {
        provider: true,
      },
    });

    throwBadRequestErrorCheck(!user || !user?.provider, 'Provider not found.');

    const appoinntmentDates =
      await this.prismaService.appointmentDates.findMany({
        where: {
          appointment: {
            providerId: user?.provider?.id,
            deletedAt: null,
          },
          paymentStatus: 'PAID',
          deletedAt: null,
        },
      });

    const unavailability = appoinntmentDates?.map((item) => {
      return item?.date?.toISOString();
    });

    return {
      message: 'Provder unavailability found successfully.',
      data: {
        unavailability: [...new Set(unavailability)],
      },
    };
  }
}
