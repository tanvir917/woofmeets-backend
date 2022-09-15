import { throwBadRequestErrorCheck } from './../global/exceptions/error-logic';
import {
  extractZoneSpecificDate,
  extractZoneSpecificDateWithFirstHourTime,
} from './../global/time/time-coverters';
import { addDays, isAfter } from 'date-fns';
import { DeleteUnavailabilityDto } from './dto/delete-unavailability.dto';
import { PrismaService } from './../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UnavailabilityDeletionService {
  constructor(private readonly prismaService: PrismaService) {}

  async delete(query: DeleteUnavailabilityDto, userId: bigint) {
    const { from, to, providerServiceIds } = query;

    throwBadRequestErrorCheck(
      isAfter(new Date(from), new Date(to ?? from)),
      'To date should be larger than from date',
    );

    const dateMaker = (
      targetDate: Date,
      increment: number,
      tz?: string,
    ): Date =>
      addDays(
        new Date(
          extractZoneSpecificDateWithFirstHourTime(
            targetDate,
            tz ?? 'America/New_York',
          ),
        ),
        increment,
      );

    const isServiceIdListNotEmpty = (providerServiceIds?.length ?? 0) > 0;

    const serviceIdQuery = isServiceIdListNotEmpty
      ? {
          in: providerServiceIds,
        }
      : {
          notIn: [],
        };

    return this.prismaService.$transaction(async (prisma) => {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          timezone: true,
        },
      });

      const startDate = dateMaker(new Date(from), 0, user?.timezone);
      const endDate = dateMaker(new Date(to ?? from), 1, user?.timezone);

      console.log({
        startDate,
        endDate,
      });

      await prisma.unavailability.updateMany({
        data: {
          deletedAt: new Date(),
        },
        where: {
          deletedAt: null,
          userId: userId,
          serviceId: serviceIdQuery,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      return `Deleted`.concat(
        ` unavailabilities from ${extractZoneSpecificDate(
          new Date(from),
          user?.timezone ?? 'America/New_York',
        )} to ${extractZoneSpecificDate(
          new Date(to ?? from),
          user?.timezone ?? 'America/New_York',
        )} at ${user?.timezone ?? 'America/New_York'} timezone`,
      );
    });
  }
}
