import { throwBadRequestErrorCheck } from './../global/exceptions/error-logic';
import {
  extractZoneSpecificDate,
  extractZoneSpecificDateWithFirstHourTime,
} from './../global/time/time-coverters';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUnavailibityDto } from './dto/create-unavailability.dto';
import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { addDays, isAfter, isSameDay } from 'date-fns';

@Injectable()
export class UnavailabilityService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prismaService: PrismaService,
  ) {
    this.logger.setContext(UnavailabilityService.name);
  }

  async create(unavailability: CreateUnavailibityDto, userId: bigint) {
    // check body
    const {
      date,
      disableAllServices,
      providerServiceId: serviceTypeId,
    } = unavailability;

    const now = new Date();

    throwBadRequestErrorCheck(
      isSameDay(new Date(date), now) === false &&
        isAfter(new Date(date), now) === false,
      'Date has to be greater than current date',
    );

    throwBadRequestErrorCheck(
      !!disableAllServices &&
        serviceTypeId === null &&
        serviceTypeId === undefined,
      'Either send a service id or disable all option',
    );

    const data = await this.prismaService.$transaction(async (prisma) => {
      const { timezone } = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          timezone: true,
        },
      });

      const userTimeZone = timezone ?? 'America/New_York';

      const start = new Date(
        extractZoneSpecificDateWithFirstHourTime(new Date(date), userTimeZone),
      );

      const end = new Date(addDays(start, 1));

      const dateQuery = {
        gte: start,
        lt: end,
      };

      const existingUnavailabilities = await prisma.unavailability.findMany({
        where: {
          userId: userId,
          date: dateQuery,
          deletedAt: null,
        },
      });

      const isAllServicesDeactivated = existingUnavailabilities.some(
        (item) => item.allServicesInactive === true,
      );

      // already all services are deactivated
      throwBadRequestErrorCheck(
        isAllServicesDeactivated,
        `All services are already unavailable for the day ${extractZoneSpecificDate(
          start,
          userTimeZone,
        )} in ${userTimeZone} timezone`,
      );

      if (disableAllServices ?? false) {
        // delete pre-existing unavailabilities
        await prisma.unavailability.updateMany({
          data: {
            deletedAt: new Date(),
          },
          where: {
            userId: userId,
            date: dateQuery,
            deletedAt: null,
          },
        });

        const result = await prisma.unavailability.create({
          data: {
            date: new Date(date),
            userId: userId,
            allServicesInactive: disableAllServices,
          },
        });

        // freshly created unavailability
        return { ...result, timezone: userTimeZone };
      }

      const isUnavailabilityExisting = existingUnavailabilities.some(
        (item) => item.serviceId === BigInt(serviceTypeId),
      );

      throwBadRequestErrorCheck(
        isUnavailabilityExisting,
        `Unavailability with provider service id ${serviceTypeId} already exists`,
      );

      const result = await prisma.unavailability.create({
        data: {
          date: date,
          userId: userId,
          serviceId: serviceTypeId,
        },
      });

      // new unavailabilty with service id
      return { ...result, timezone: userTimeZone };
    });

    return data;
  }
}
