import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isBefore } from 'date-fns';
import { AvailabilityGetServcie } from 'src/availability/services/availability.get.service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchProviderDto } from './dto/search.provider.dto';

@Injectable()
export class ProviderListService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly availabilityService: AvailabilityGetServcie,
  ) {}

  async search(body: SearchProviderDto) {
    let {
      service: slug,
      serviceId,
      pet_type,
      petsId,
      service_frequency,
      lat,
      lng: long,
      startDate,
      endDate,
      homeType,
      yardType,
      preferenceIds,
      minPrice,
      maxPrice,
      page,
      limit,
    } = body;

    let attributesIds = [];
    let customQuery = {};
    let rawWhere = ``;

    if (preferenceIds) {
      attributesIds = preferenceIds.split(',');
      attributesIds = attributesIds?.map((id) => {
        return BigInt(id);
      });
    }

    if (attributesIds.length > 0) {
      customQuery = {
        provider: {
          HomeAttributes: {
            some: {
              homeAttributeTypeId: {
                in: attributesIds,
              },
              deletedAt: null,
            },
          },
        },
      };
    }

    if (minPrice || maxPrice) {
      minPrice = minPrice ?? 1;
      maxPrice = maxPrice ?? 100;
      customQuery = {
        ...customQuery,
        ServiceHasRates: {
          some: {
            amount: {
              gte: minPrice,
              lte: maxPrice,
            },
            serviceTypeRate: {
              serviceRateTypeId: 1,
            },
          },
        },
      };
    }

    if (homeType) {
      rawWhere = `AND p."homeType" = '${homeType}' `;
    }

    if (yardType) {
      rawWhere = rawWhere + `AND p."yardType" = '${yardType}' `;
    }

    if (!page || page < 1) page = 1;
    if (!limit) limit = 20;

    throwBadRequestErrorCheck(
      isBefore(new Date(endDate), new Date(startDate)),
      'End date can not be less than start date!',
    );

    const sql = `select ST_DistanceSphere(ST_MakePoint(p.longitude, p.latitude), ST_MakePoint(${long}, ${lat})) / 1000 as distance, ps."id" as id from "ProviderServices" as ps inner join "Provider" as p on ps."providerId" = p.id WHERE ps."serviceTypeId" = ${serviceId} ${rawWhere} group by p.id, ps.id having (ST_DistanceSphere(ST_MakePoint(p.longitude, p.latitude), ST_MakePoint(${long}, ${lat})) / 1000) < 50 ORDER BY distance asc`;
    // console.log(sql);
    const raw = await this.prismaService.$queryRaw<
      {
        id: number;
        distance: number;
      }[]
    >(Prisma.raw(sql));

    const tempids = [];
    raw &&
      raw?.map((row) => {
        tempids.push(row.id);
      });

    throwNotFoundErrorCheck(
      tempids.length === 0,
      'Provider not found on specific criteria.',
    );

    console.log(customQuery);
    const services = await this.prismaService.providerServices.findMany({
      where: {
        id: {
          in: tempids,
        },
        isActive: true,
        isApproved: true,
        deletedAt: null,
        ...customQuery,
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
                    country: true,
                  },
                },
              },
            },
            providerDetails: true,
            HomeAttributes: true,
          },
        },
        ServiceHasRates: {
          where: {
            serviceTypeRate: {
              serviceRateTypeId: 1, // base rate only
            },
          },
          include: {
            serviceTypeRate: true,
          },
        },
      },
      take: limit,
      skip: (page - 1) * limit,
    });

    throwNotFoundErrorCheck(
      !services,
      'Provider not found with specific criteria.',
    );

    const providers = [];
    const start = startDate ? new Date(startDate) : new Date();
    const tmpQuery = {
      startDate: new Date(start).toISOString(),
      endDate:
        endDate ?? new Date(start.setDate(start.getDate() + 3)).toISOString(),
    };

    await Promise.all(
      services.map(async (service) => {
        const s = service;
        const tmp = raw && raw?.find((row) => BigInt(row.id) === service.id);
        s.provider.user.password = null;
        try {
          const { data } = await this.availabilityService.getAvailability(
            service.provider.user.opk,
            service.id,
            tmpQuery,
          );
          providers.push({
            ...s,
            distance: {
              id: tmp.id,
              distance: tmp.distance * 0.621371,
              unit: 'mi',
            },
            availability: data,
          });
        } catch (e) {
          console.log('Provider list: availability ', e);
          providers.push({
            ...s,
            distance: {
              id: tmp.id,
              distance: tmp.distance * 0.621371,
              unit: 'mi',
            },
            availability: null,
          });
        }
      }),
    );

    throwNotFoundErrorCheck(
      providers.length === 0,
      'Provider not found with specific criteria.',
    );

    const meta = {
      per_page: limit,
      page,
    };

    return { message: 'Provider found successfully.', data: providers, meta };
  }
}
