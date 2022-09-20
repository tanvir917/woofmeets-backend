import { Injectable } from '@nestjs/common';
import { isSameDay, isBefore } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  throwBadRequestErrorCheck,
  throwUnauthorizedErrorCheck,
} from 'src/global/exceptions/error-logic';
import { extractZoneSpecificDateWithFirstHourTime } from 'src/global/time/time-coverters';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAvailableDateDto } from '../dto/create-date.dto';

@Injectable()
export class AvailableDateService {
  constructor(private readonly prismaService: PrismaService) {}

  async addAvailableDate(userId: bigint, body: CreateAvailableDateDto) {
    const { from, to, providerServiceIds } = body;
    /**
     * from, to, serviceid validate
     * get all services for userId
     * loop through and check prev entry with same date and serviceId
     * check unavailable table with same date and serviceId and delete
     * create available date row and delete previous entry
     */
    const serviceList = [];
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
      },
    });
    const { timezone } = user;

    if (to) {
      throwBadRequestErrorCheck(
        isBefore(new Date(to), new Date(from)),
        'Invalid date range!',
      );
    }
    console.log({
      isBefore: isBefore(new Date(to), new Date(from)),
      sameDay:
        Intl.DateTimeFormat('en-US').format(new Date(from)) ===
        Intl.DateTimeFormat('en-US').format(new Date()),
    });

    if (providerServiceIds.length > 0) {
      const services = await this.prismaService.providerServices.findMany({
        where: {
          id: {
            in: providerServiceIds,
          },
          deletedAt: null,
        },
        include: {
          provider: {
            select: {
              userId: true,
            },
          },
        },
      });

      services.map((service) => {
        throwUnauthorizedErrorCheck(
          service.provider?.userId !== userId,
          'Service does not belong the specific user.',
        );
        serviceList.push(service.id);
      });
    } else {
      const services = await this.prismaService.providerServices.findMany({
        where: {
          provider: {
            userId,
            deletedAt: null,
          },
          deletedAt: null,
        },
      });
      services.map((s) => serviceList.push(s.id));
    }

    throwBadRequestErrorCheck(
      Intl.DateTimeFormat('en-US').format(new Date(from)) !==
        Intl.DateTimeFormat('en-US').format(new Date()),
      'Date already expired.',
    );

    const till = new Date(to ?? from);
    const timediff = Math.floor(
      (new Date(till).getTime() - new Date(from).getTime()) /
        (24 * 3600 * 1000),
    );
    const dateRange = new Date(from).getDate() + timediff;
    const dates = [];

    for (let i = new Date(from).getDate(); i <= dateRange; i++) {
      const d = new Date(
        new Date(new Date().setDate(i)).setHours(new Date().getHours()),
      ).toISOString();
      // make all possible combination of date and service id
      serviceList.map((s) => {
        dates.push({
          date: new Date(
            extractZoneSpecificDateWithFirstHourTime(
              new Date(d),
              timezone ?? 'America/New_York',
            ),
          ),
          serviceId: s,
          userId,
        });
      });
    }

    const unavailableDates = await this.prismaService.unavailability.updateMany(
      {
        data: {
          deletedAt: new Date(),
        },
        where: {
          deletedAt: null,
          date: {
            gte: new Date(
              extractZoneSpecificDateWithFirstHourTime(
                new Date(from),
                timezone ?? 'America/New_York',
              ),
            ),
            lte: new Date(
              extractZoneSpecificDateWithFirstHourTime(
                new Date(till),
                timezone ?? 'America/New_York',
              ),
            ),
          },
          serviceId: {
            in: serviceList,
          },
        },
      },
    );
    const delAvailable = await this.prismaService.availableDate.updateMany({
      where: {
        date: {
          gte: new Date(
            extractZoneSpecificDateWithFirstHourTime(
              new Date(from),
              timezone ?? 'America/New_York',
            ),
          ),
          lte: new Date(
            extractZoneSpecificDateWithFirstHourTime(
              new Date(till),
              timezone ?? 'America/New_York',
            ),
          ),
        },
        serviceId: {
          in: serviceList,
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    const availableDates = await this.prismaService.availableDate.createMany({
      data: dates,
    });

    return {
      message: 'Availability created successfully.',
    };
  }
}
