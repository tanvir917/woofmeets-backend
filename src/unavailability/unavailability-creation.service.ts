import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import {
  extractZoneSpecificDateWithFirstHourTime,
  isSameDate,
} from './../global/time/time-coverters';
import { CreateUnavailibityDto } from './dto/create-unavailability.dto';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from './../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { isBefore, addDays } from 'date-fns';

@Injectable()
export class UnavailabilityCreationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UnavailabilityCreationService.name);
  }

  async createSingle(newUnavailability: CreateUnavailibityDto, userId: bigint) {
    // check whether the date is valid or not
    // check whether from date is before current date or not
    const { date, providerServiceId } = newUnavailability;

    const parsedDate = new Date(date);
    const now = new Date();

    throwBadRequestErrorCheck(
      isBefore(parsedDate, now) && !isSameDate(parsedDate, now),
      'Date cannot be in the past',
    );

    const dateMaker = (increment: number, tz?: string): Date =>
      addDays(
        new Date(
          extractZoneSpecificDateWithFirstHourTime(
            parsedDate,
            tz ?? 'America/New_York',
          ),
        ),
        increment,
      );

    // to check whether user has a partcular service

    const additionalQuery = {
      ...(providerServiceId && {
        provider: {
          providerServices: {
            some: {
              id: {
                equals: providerServiceId,
              },
              deletedAt: null,
            },
          },
        },
      }),
    };

    return this.prismaService.$transaction(async (prisma) => {
      // check whether provider provides the service
      // get user's timezone
      // parse requested date as user's timezone
      // query start and end as per user's timezone

      const existingInfo = await prisma.user.findFirst({
        where: {
          id: userId,
          ...additionalQuery,
        },
        select: {
          id: true,
          timezone: true,
          provider: {
            select: {
              providerServices: {
                select: {
                  id: true,
                  serviceTypeId: true,
                },
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

      throwBadRequestErrorCheck(
        !existingInfo?.id,
        `Provider service id ${providerServiceId} has been deleted or doesn't belong to user`,
      );

      const startDate = dateMaker(0, existingInfo?.timezone);
      const endDate = dateMaker(1, existingInfo?.timezone);
      const dateQuery = {
        date: {
          gte: startDate,
          lt: endDate,
        },
        deletedAt: null,
      };

      if (!!providerServiceId) {
        const unavailability = await prisma.unavailability.findFirst({
          where: {
            serviceId: providerServiceId,
            ...dateQuery,
          },
          select: {
            id: true,
          },
        });

        throwBadRequestErrorCheck(
          !!unavailability?.id,
          'Unavailabilty already exists',
        );

        return prisma.unavailability.create({
          data: {
            userId: userId,
            serviceId: providerServiceId,
            date: new Date(date),
          },
        });
      }

      const providerServicesMap = new Map<number, boolean>();

      existingInfo?.provider?.providerServices?.forEach((item) => {
        providerServicesMap.set(item.serviceTypeId, false);
      });

      const exisitingUnavailabilities = await prisma.unavailability.findMany({
        where: {
          serviceId: {
            not: null,
          },
          ...dateQuery,
        },
        select: {
          id: true,
          service: {
            select: {
              id: true,
              serviceTypeId: true,
            },
          },
        },
      });

      exisitingUnavailabilities.forEach((item) => {
        providerServicesMap.set(item?.service?.serviceTypeId, true);
      });

      const createRemaining = existingInfo?.provider?.providerServices
        ?.filter(
          (item) => providerServicesMap.get(item?.serviceTypeId) === false,
        )
        .map((item) => ({
          date: new Date(date),
          serviceId: item.id,
          userId: userId,
        }));

      await prisma.unavailability.createMany({
        data: createRemaining,
      });

      return {
        allServicesUnavailable: true,
        date: date,
        timezone: existingInfo?.timezone ?? 'America/New_York',
      };
    });
  }
}
