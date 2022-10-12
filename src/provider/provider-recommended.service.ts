import { Injectable } from '@nestjs/common';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { RecommendedProviderDto } from './dto/recommended.dto';

@Injectable()
export class ProviderRecommendedService {
  constructor(private readonly prismaService: PrismaService) {}

  async recommended(query: RecommendedProviderDto) {
    const { serviceTypeId, lat, lng: long } = query;
    const limit: number = 5;
    let serviceQuery: any = {};

    if (serviceTypeId) {
      serviceQuery = {
        serviceTypeId,
      };
    }

    const totalProvider = await this.prismaService.providerServices.count({
      where: {
        isActive: true,
        isApproved: true,
        deletedAt: null,
        ...serviceQuery,
      },
    });
    const skip = Math.floor(Math.random() * (totalProvider - limit));

    const providers = await this.prismaService.providerServices.findMany({
      where: {
        isActive: true,
        isApproved: true,
        deletedAt: null,
        ...serviceQuery,
      },
      include: {
        provider: {
          include: {
            user: {
              include: {
                basicInfo: {
                  select: {
                    addressLine1: true,
                    city: true,
                    state: true,
                    zipCode: true,
                  },
                },
              },
            },
            HomeAttributes: true,
          },
        },
        ServiceHasRates: {
          where: {
            serviceTypeRate: {
              serviceRateTypeId: 1, // base rate only
            },
          },
        },
      },
      take: limit,
      skip,
    });

    throwNotFoundErrorCheck(!providers, 'Recommended provider not found!');

    return { message: 'Recommended provider found successfully.', providers };
  }
}
