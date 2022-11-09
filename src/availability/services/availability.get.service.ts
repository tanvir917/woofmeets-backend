import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { utcToZonedTime, formatInTimeZone, format } from 'date-fns-tz';
import { GetAvailableCalenderDto } from 'src/provider/dto/get.available.dto';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { extractZoneSpecificDateWithFirstHourTime } from 'src/global/time/time-coverters';
import { addDays } from 'date-fns';
import { generateDatesFromAndTo } from 'src/global/time/time-generators';

@Injectable()
export class AvailabilityGetServcie {
  constructor(private readonly prismaService: PrismaService) {}

  async getAvailability(
    opk: string,
    serviceId: bigint,
    query: GetAvailableCalenderDto,
    isMultiple: boolean = false,
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
    const from = new Date(startDate);
    const to = new Date(till);

    const initDates = [];
    const filtered = [];

    const { days, tz } = await this.findAvailable(serviceId);

    if (!isMultiple) {
      throwNotFoundErrorCheck(
        !days,
        'Availability not found with specific service id.',
      );

      throwBadRequestErrorCheck(
        opk !== days?.service?.provider?.user?.opk,
        'Service not found with specific identifier!',
      );
    }

    const dateRange = generateDatesFromAndTo(from, till, []);

    for (var date of dateRange) {
      initDates.push(date);
    }

    initDates?.map((date) => {
      const getDay = DAYS[new Date(date).getDay()];
      if (days && days[getDay]) {
        filtered.push(date);
      }
    });

    const toDate = initDates[initDates.length - 1];

    const { availability, unavailablilty } =
      await this.availableAndUnavailableDates(serviceId, startDate, toDate, tz);

    const dates = await this.availableDates(
      filtered,
      availability,
      unavailablilty,
      tz,
    );

    return {
      message: 'Calendar found successfully.',
      data: {
        timezone: tz,
        dates,
      },
    };
  }

  async getAllServiceAvailability(
    userId: bigint,
    query: GetAvailableCalenderDto,
  ) {
    const services = await this.prismaService.providerServices.findMany({
      where: {
        provider: {
          userId,
        },
        deletedAt: null,
      },
      include: {
        provider: {
          include: {
            user: {
              select: {
                opk: true,
                id: true,
              },
            },
          },
        },
        serviceType: true,
      },
    });

    for (let service of services) {
      const opk = service?.provider?.user?.opk;
      let { data } = await this.getAvailability(opk, service.id, query, true);
      service['availability'] = data;
    }

    return { data: services };
  }

  async findAvailable(serviceId: bigint) {
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
            serviceType: true,
          },
        },
      },
    });

    const tz = days?.service?.provider?.user?.timezone ?? 'America/New_York';

    return { days, tz };
  }

  async availableAndUnavailableDates(serviceId: bigint, startDate, toDate, tz) {
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
    // availability.map((a) => {
    //   filtered.push(a.date);
    // });

    const unavailablilty = await this.prismaService.unavailability.findMany({
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

    return { availability, unavailablilty };
  }

  async availableDates(prevDate, availability, unavailablilty, tz) {
    const dates = prevDate;
    const timezoned = [];
    const unavailableDates = [];

    availability.map((a) => {
      dates.push(a.date);
    });

    dates.map((date) => {
      const availableTime = format(date, 'yyyy-MM-dd');
      unavailablilty.map((un) => {
        const ud = format(un.date,'yyyy-MM-dd');
        if (ud === availableTime) {
          unavailableDates.push(ud);
        }
      });
      timezoned.push(availableTime);
    });
    const final = timezoned.filter((t) => !unavailableDates.includes(t));
    return final;
  }
}
