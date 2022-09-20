import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { utcToZonedTime, formatInTimeZone } from 'date-fns-tz';
import { GetAvailableCalenderDto } from 'src/provider/dto/get.available.dto';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
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
     * ? get all unavailable dates from db
     * * get user timezome for opk from db
     * ! remove all unavailable dates from all dates
     * * return dates based on provider timezone
     */

    const { startDate, range } = query;
    const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    const start = new Date(startDate).getDate();
    // const lastDate = new Date(
    //   new Date().getFullYear(),
    //   new Date().getMonth() + 1,
    //   0,
    // ).getDate();

    const end = start + range;

    const initDates = [];
    for (let i = start; i <= end ?? end; i++) {
      initDates.push(
        new Date(
          new Date(new Date().setDate(i)).setHours(
            new Date(startDate).getHours(),
          ),
        ).toISOString(),
      );
    }

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

    const filtered = [];
    initDates.map((date) => {
      const getDay = DAYS[new Date(date).getDay()];
      if (days[getDay]) {
        filtered.push(date);
      }
    });

    throwBadRequestErrorCheck(
      opk !== days.service?.provider?.user?.opk,
      'Service not found with specific identifier!',
    );

    const unavailable = await this.prismaService.unavailability.findMany({
      where: {
        userId: days.service?.provider?.user?.id,
        deletedAt: null,
        date: {
          gte: new Date(startDate).toISOString(),
        },
      },
    });

    /**
     * normalize unavilable dates
     * if 'allServicesInactive' true then mark it unavialable from the initDates
     * if 'allServicesInactive' false then check with serviceId
     */

    const timezoned = [];
    const unavailableDates = [];
    filtered.map((date) => {
      const availableTime = formatInTimeZone(date, tz, 'yyyy-MM-dd');
      unavailable.map((un) => {
        const ud = formatInTimeZone(un.date, tz, 'yyyy-MM-dd');
        if (ud === availableTime) {
          console.log('unavailable shit', ud);
          if (
            un.allServicesInactive === true ||
            un.serviceId === BigInt(serviceId)
          ) {
            unavailableDates.push(ud);
          }
        }
      });
      timezoned.push(availableTime);
    });
    const final = timezoned.filter((t) => !unavailableDates.includes(t));

    return {
      availableDates: filtered,
      timezoned,
      final,
      // initDates,
      unavailableDates,
      unavailable,
      days,
      start,
    };
  }
}
