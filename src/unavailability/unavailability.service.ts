import { Injectable } from '@nestjs/common';
import { addDays } from 'date-fns';
import { PinoLogger } from 'nestjs-pino';
import { extractZoneSpecificDate } from 'src/global';
import { dateMaker } from 'src/global/time/time-generators';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUnavailabilityDto } from './dto/get-unavailability.dto';

@Injectable()
export class UnavailabilityService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UnavailabilityService.name);
  }

  async get(req: GetUnavailabilityDto) {
    const { from, range, opk } = req;

    const { timezone } = await this.prismaService.user.findUnique({
      where: {
        opk: opk,
      },
      select: {
        timezone: true,
      },
    });

    const providerTimeZone = timezone ?? 'America/New_York';

    const [fromDate, toDate] = [
      dateMaker(new Date(from), 0, providerTimeZone),
      dateMaker(addDays(new Date(from), range), 1, providerTimeZone),
    ];

    const dates = await this.prismaService.unavailability.findMany({
      where: {
        date: {
          gte: fromDate,
          lt: toDate,
        },
        deletedAt: null,
      },
    });

    const unavailabilities = [
      ...new Set(
        dates.map((item) => {
          return extractZoneSpecificDate(item.date, providerTimeZone);
        }),
      ),
    ];

    return {
      providerTimeZone,
      unavailabilities,
    };
  }
}
