import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isBefore, nextSunday } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { PinoLogger } from 'nestjs-pino';
import { DaysOfWeek, generateRecurringDates } from 'src/global';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { formatVisitsByDay } from '../helpers/appointment-visits';

@Injectable()
export class AppointmentRecurringService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppointmentRecurringService.name);
  }

  async generateRecurringDates(opk: string) {
    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(
      appointment.status !== 'ACCEPTED',
      "Appointment isn't in ACCEPTED state",
    );

    const proposal = await this.prismaService.appointmentProposal.findFirst({
      where: {
        id: appointment.lastProposalId,
      },
      select: {
        length: true,
        isRecurring: true,
        recurringStartDate: true,
        recurringSelectedDay: true,
      },
    });

    const recurringStartDate = utcToZonedTime(
      proposal.recurringStartDate,
      appointment.providerTimeZone,
    );

    const currentDate = utcToZonedTime(
      new Date(),
      appointment.providerTimeZone,
    );

    if (isBefore(currentDate, recurringStartDate)) {
      const result = await this.prismaService.appointmentDates.findMany({
        where: {
          appointmentProposalId: appointment.lastProposalId,
        },
      });
      return {
        message: 'Appointment Dates Already Generated',
        result,
      };
    } else {
      const { recurringDays, visitsByDay } = formatVisitsByDay(
        proposal.recurringSelectedDay as Prisma.JsonArray,
      );

      const holidays = await this.prismaService.holidays.findMany({});

      const result = generateRecurringDates(
        recurringStartDate,
        appointment.providerTimeZone,
        recurringDays as DaysOfWeek[],
        holidays,
        visitsByDay,
        proposal.length,
        false,
      );

      const nextRcurringStartDate = nextSunday(
        new Date(proposal.recurringStartDate),
      );
      await this.prismaService.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          appointmentProposal: {
            update: {
              where: {
                id: appointment.lastProposalId,
              },
              data: {
                recurringStartDate: nextRcurringStartDate.toISOString(),
                AppointmentDates: {
                  create: result.map((data) => ({
                    ...data,
                    appointmentId: appointment.id,
                  })),
                },
              },
            },
          },
        },
      });
      return {
        message: 'Recurring dates generated successfully',
        result,
      };
    }
  }
}
