import { Injectable } from '@nestjs/common';
import { isSameDay, isBefore, isAfter, addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import {
  throwBadRequestErrorCheck,
  throwUnauthorizedErrorCheck,
} from 'src/global/exceptions/error-logic';
import {
  extractZoneSpecificDateWithFirstHourTime,
  isSameDate,
} from 'src/global/time/time-coverters';
import { generateDatesFromAndTo } from 'src/global/time/time-generators';
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

    const parsedFromDate = new Date(from);
    const parsedToDate = new Date(to ?? from);
    const now = new Date();
    const isInPast =
      isBefore(parsedFromDate, now) &&
      !isSameDate(parsedFromDate, now, 'Etc/UTC');

    const isInvalidRange = isAfter(parsedFromDate, parsedToDate);

    throwBadRequestErrorCheck(isInPast, 'From date cannot be in the past');
    throwBadRequestErrorCheck(
      isInvalidRange,
      'From date cannot be greater than to date',
    );

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

    const till = new Date(to ?? from);
    const fromD = new Date(from);
    const toD = new Date(till);
    const dates = [];

    const dateRange = generateDatesFromAndTo(parsedFromDate, parsedToDate, []);

    for (var date of dateRange) {
      serviceList.map((s) => {
        dates.push({
          date,
          serviceId: s,
          userId,
        });
      });
    }

    const dateMaker = (date: Date, add: number = 0) => {
      return addDays(
        new Date(
          extractZoneSpecificDateWithFirstHourTime(
            date,
            timezone ?? 'America/New_York',
          ),
        ),
        add,
      );
    };

    const [minDate, maxDate] = [
      dateMaker(parsedFromDate, 0),
      dateMaker(parsedToDate, 1),
    ];

    await this.prismaService.$transaction([
      this.prismaService.unavailability.updateMany({
        data: {
          deletedAt: new Date(),
        },
        where: {
          deletedAt: null,
          date: {
            gte: minDate,
            lte: maxDate,
          },
          serviceId: {
            in: serviceList,
          },
        },
      }),
      this.prismaService.availableDate.updateMany({
        where: {
          date: {
            gte: minDate,
            lte: maxDate,
          },
          serviceId: {
            in: serviceList,
          },
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      }),
      this.prismaService.availableDate.createMany({
        data: dates,
      }),
    ]);

    return {
      message: 'Availability created successfully.',
    };
  }
}
