import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import { GetAvailableCalenderDto } from 'src/provider/dto/get.available.dto';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { extractZoneSpecificDateWithFirstHourTime } from 'src/global/time/time-coverters';
@Injectable()
export class AvailabilityGetServcie {
  constructor(private readonly prismaService: PrismaService) {}

  async getAvailability(
    opk: string,
    serviceId: number,
    query: GetAvailableCalenderDto,
  ) {
    /**
     * take start_date and get range from end of the month or get range from FE
     * loop through the range and get all dates
     * get all available days from db
     * select only matched days from all dates
     * get available date and add them on queue
     * get all unavailable dates from db
     * get user timezome for opk from db
     * remove all unavailable dates from all dates
     * return dates based on provider timezone
     */

    const { startDate, endDate } = query;
    const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    const start = new Date(startDate).getDate();
    const till = new Date(endDate ?? startDate);

    const timediff = Math.floor(
      (new Date(till).getTime() - new Date(startDate).getTime()) /
        (24 * 3600 * 1000),
    );
    const range = new Date(startDate).getDate() + timediff;
    const end = start + range;
    const initDates = [];
    const filtered = [];
    const timezoned = [];
    const unavailableDates = [];

    const days = await this.prismaService.availableDay.findFirst({
      where: {
        providerServiceId: serviceId,
        deletedAt: null,
      },
      include: {
        service: {
          select: {
            provider: {
              select: {
                user: {
                  select: {
                    opk: true,
                    id: true,
                    timezone: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const tz = days.service?.provider?.user?.timezone ?? 'America/New_York';

    throwBadRequestErrorCheck(
      opk !== days.service?.provider?.user?.opk,
      'Service not found with specific identifier!',
    );

    for (let i = start; i <= end ?? end; i++) {
      initDates.push(
        new Date(
          extractZoneSpecificDateWithFirstHourTime(
            new Date(new Date().setDate(i)),
            tz,
          ),
        ),
      );
    }

    initDates.map((date) => {
      const getDay = DAYS[new Date(date).getDay()];
      if (days[getDay]) {
        filtered.push(date);
      }
    });
    const toDate = initDates[initDates.length - 1];

    /**
     * get available dates
     * add them on filtered queue
     */

    const availability = await this.prismaService.availableDate.findMany({
      where: {
        serviceId,
        deletedAt: null,
        date: {
          gte: new Date(
            extractZoneSpecificDateWithFirstHourTime(new Date(startDate), tz),
          ),
          lte: new Date(
            extractZoneSpecificDateWithFirstHourTime(new Date(toDate), tz),
          ),
        },
      },
    });
    availability.map((a) => {
      filtered.push(a.date);
    });

    const unavailable = await this.prismaService.unavailability.findMany({
      where: {
        serviceId,
        deletedAt: null,
        date: {
          gte: new Date(
            extractZoneSpecificDateWithFirstHourTime(new Date(startDate), tz),
          ),
          lte: new Date(
            extractZoneSpecificDateWithFirstHourTime(new Date(toDate), tz),
          ),
        },
      },
    });

    filtered.map((date) => {
      const availableTime = formatInTimeZone(date, tz, 'yyyy-MM-dd');
      unavailable.map((un) => {
        const ud = formatInTimeZone(un.date, tz, 'yyyy-MM-dd');
        if (ud === availableTime) {
          unavailableDates.push(ud);
        }
      });
      timezoned.push(availableTime);
    });
    const final = timezoned.filter((t) => !unavailableDates.includes(t));

    return {
      message: 'Calendar found successfully.',
      data: {
        timezone: tz,
        dates: final,
      },
    };
  }
}
