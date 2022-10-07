import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AvailabilityGetServcie } from 'src/availability/services/availability.get.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchProviderDto } from './dto/search.provider.dto';
import { addDays, isBefore } from 'date-fns';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';

@Injectable()
export class ProviderListService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly availabilityService: AvailabilityGetServcie,
  ) {}

  async search(body: SearchProviderDto) {
    const {
      service: slug,
      pet_type,
      petsId,
      service_frequency,
      lat,
      lng: long,
      startDate,
      endDate,
    } = body;

    /**
     * inner join with service and provider
     * check service id / slug
     * geo location search
     * available day get
     * available date + unavailable date get
     * availability match
     * get provider from the above result
     * get rates
     */
    throwBadRequestErrorCheck(
      isBefore(new Date(endDate), new Date(startDate)),
      'End date can not be less than start date!',
    );

    const raw = await this.prismaService.$queryRaw<
      {
        id: number;
      }[]
    >(
      Prisma.sql`select ST_DistanceSphere(ST_MakePoint(p.longitude, p.latitude), ST_MakePoint(${long}, ${lat})) / 1000 as distance, ps.* from "ProviderServices" as ps inner join "Provider" as p on ps."providerId" = p.id group by p.id, ps.id having (ST_DistanceSphere(ST_MakePoint(p.longitude, p.latitude), ST_MakePoint(${long}, ${lat})) / 1000) < 30 ORDER BY distance asc`,
    );

    /**
     * searchOptions: {
     * * pet_type: ["dog"] || ["cat"] || ["dog","cat"]
     * * petsId: [],  Ids got from the pets api
     * * service_slug: "boarding" || "sitting" || "day_care" || "visit" || "walking",
     * * location: {lat:"",lng:""},
     * * service_frequency: "onetime" || "repeat",
     * * weekdays: ["sun","mon","tue","wed","thu","fri","sat"],
     * * startDate: undefined || ISO date format,
     * * endDate: undefined || ISO date format,
     * * numberOfPets:1 || 2 || 3+,
     * * dogSize:"0-15"|| "16-40" || "41-100" || "100+",
     * * minPrice: number,
     * * maxPrice:number,
     * * additionalFilters: [], Ids of the additional filters got from the api.
     * }
     */

    const tempids = [];
    raw &&
      raw?.map((row) => {
        tempids.push(row.id);
      });

    throwNotFoundErrorCheck(
      tempids.length === 0,
      'Provider not found on specific criteria.',
    );

    const services = await this.prismaService.providerServices.findMany({
      where: {
        id: {
          in: tempids,
        },
        isActive: true,
        isApproved: true,
        deletedAt: null,
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
          },
        },
        ServiceHasRates: true,
      },
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
        let s = service;
        s.provider.user.password = null;
        try {
          const { data } = await this.availabilityService.getAvailability(
            service.provider.user.opk,
            service.id,
            tmpQuery,
          );
          providers.push({ ...s, availability: data });
        } catch (e) {
          console.log('Provider list: availability ', e);
          providers.push({ ...s, availability: null });
        }
      }),
    );

    return { providers };
  }
}
