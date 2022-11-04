import { Holidays, Prisma } from '@prisma/client';
import {
  addDays,
  addMinutes,
  differenceInDays,
  isAfter,
  isBefore,
  isSameDay,
} from 'date-fns';
import { format, toDate, utcToZonedTime } from 'date-fns-tz';
import { DaysOfWeek, extractDay, generateDays } from 'src/global';
import {
  convertToZoneSpecificDateTime,
  extractZoneSpecificDateWithFirstHourTime,
  extractZoneSpecificDateWithFixedHourTime,
  getZoneTimeString,
} from 'src/global/time/time-coverters';

export class DateType {
  date: string;
}

export class TimingType {
  dropOffStartTime: string;
  dropOffEndTime: string;
  pickUpStartTime: string;
  pickUpEndTime: string;
}

export class VisitType {
  name?: string;
  day?: string;
  date?: string;
  visits?: string[];
}

export class VisitsType {
  id: number;
  time: string;
}

export class ProposalVisits {
  id: number;
  date?: string;
  name: string;
  selected?: boolean;
  startDate?: boolean;
  visits: VisitsType[];
}

export const formatVisitsByDay = (recurringSelectedDays: Prisma.JsonArray) => {
  let recurringDays = recurringSelectedDays.map(
    (item) => (item as Prisma.JsonObject).name,
  );
  recurringDays = (recurringDays as string[]).map(
    (item: string) => item[0].toUpperCase() + item.slice(1),
  );
  const visitsByDay = new Map<DaysOfWeek, Prisma.JsonObject[]>();
  recurringSelectedDays.forEach((item) => {
    const itemObject = item as Prisma.JsonObject;

    let day = itemObject.name as string;

    day = day[0].toUpperCase() + day.slice(1);
    visitsByDay.set(
      day as DaysOfWeek,
      itemObject.visits as Prisma.JsonObject[],
    );
  });

  return { recurringDays, visitsByDay };
};
export const formatTimeFromMeridien = (time: string) => {
  const [startingTime, meridien] = time.split(' ');
  const [hour, minute] = startingTime.split(':');
  const startingHour = parseInt(hour) + (meridien === 'PM' ? 12 : 0);
  return `T${startingHour >= 10 ? '' : '0'}${startingHour}:${
    minute.length === 1 ? '0' : ''
  }${minute}:00`;
};

export const formatDatesWithTimeZone = (dates: string[], timeZone: string) => {
  const result: string[] = [];
  for (let i = 0; i < dates.length; i++) {
    const currentDate = new Date(dates[i].split('T')[0]);
    result.push(
      extractZoneSpecificDateWithFirstHourTime(currentDate, timeZone),
    );
  }
  return result;
};

export const formatDatesWithStartEndTimings = (
  dates: string[],
  timing: TimingType,
  timeZone: string,
) => {
  const dropOffStartTime = formatTimeFromMeridien(timing.dropOffStartTime);
  const pickUpEndTime = formatTimeFromMeridien(timing.pickUpEndTime);
  const formattedDates: DateType[] = [];
  const startDate = new Date(dates[0].split('T')[0]);

  formattedDates.push({
    date: extractZoneSpecificDateWithFixedHourTime(
      startDate,
      timeZone,
      dropOffStartTime,
    ),
  });

  for (let i = 1; i < dates.length - 1; i++) {
    const currentDate = new Date(dates[i].split('T')[0]);
    formattedDates.push({
      date: extractZoneSpecificDateWithFirstHourTime(currentDate, timeZone),
    });
  }

  const endDate = new Date(dates[dates.length - 1].split('T')[0]);
  formattedDates.push({
    date: extractZoneSpecificDateWithFixedHourTime(
      endDate,
      timeZone,
      pickUpEndTime,
    ),
  });

  return formattedDates;
};

export const checkIfAnyDateHoliday = (
  dates: Date[],
  holidays: Holidays[],
  timeZone: string,
) => {
  let isThereAnyHoliday = false;
  const formattedDatesWithHolidays = [];
  for (let i = 0; i < dates.length; i++) {
    const currentDate = new Date(dates[i]);
    const { isHoliday, holidayNames } = checkIfHoliday(
      currentDate,
      holidays,
      timeZone,
    );

    const formatedDate = {
      date: format(dates[i], 'yyyy-MM-dd HH:mm:ssxxx', { timeZone }),
      localTime: format(dates[i], 'yyyy-MM-dd HH:mm:ssxxx KK:mma', {
        timeZone,
      }),
      monthDay: format(dates[i], 'LLL d', {
        timeZone,
      }),
      isHoliday,
      holidayNames,
      day: extractDay(dates[i], timeZone),
    };

    isThereAnyHoliday = isThereAnyHoliday || isHoliday;
    formattedDatesWithHolidays.push(formatedDate);
  }
  return { isThereAnyHoliday, formattedDatesWithHolidays };
};

export const generateDatesBetween = (
  proposalStartDate: string,
  proposalEndDate: string,
  timeZone: string,
) => {
  const dates: string[] = [];
  const from = convertToZoneSpecificDateTime(
    new Date(proposalStartDate),
    timeZone,
  );
  dates.push(format(from, 'yyyy-MM-dd HH:mm:ssxxx', { timeZone }));

  const to = convertToZoneSpecificDateTime(new Date(proposalEndDate), timeZone);
  const difference = differenceInDays(to, from);
  for (
    let i = 1, current = from;
    i < difference && !isSameDay(addDays(current, 1), from);
    i++
  ) {
    current = addDays(current, 1);
    dates.push(format(current, 'yyyy-MM-dd HH:mm:ssxxx', { timeZone }));
  }
  dates.push(format(to, 'yyyy-MM-dd HH:mm:ssxxx', { timeZone }));
  return dates;
};

export class HolidayType {
  title: string;
  startDate: string;
  endDate: string;
  timeZone: string;
}

export function checkIfHoliday(
  date: Date,
  holidays: HolidayType[],
  timeZone: string,
) {
  let isHoliday = false;
  const holidayNames: string[] = [];
  const newDate = utcToZonedTime(
    toDate(date, {
      timeZone,
    }),
    timeZone,
  );

  for (let i = 0; i < holidays.length; i++) {
    if (holidays[i].timeZone !== timeZone && holidays[i].timeZone !== '*')
      continue;
    const holidayFrom = utcToZonedTime(
      toDate(holidays[i].startDate, {
        timeZone,
      }),
      timeZone,
    );
    const holidayTo = utcToZonedTime(
      toDate(holidays[i].endDate, {
        timeZone,
      }),
      timeZone,
    );

    const isDaysSame =
      isSameDay(newDate, holidayFrom) || isSameDay(newDate, holidayTo);
    if (!isDaysSame) {
      const isAfterHoliday = isAfter(newDate, holidayFrom);
      const isBeforeHoliday = isBefore(newDate, holidayTo);
      isHoliday = isAfterHoliday && isBeforeHoliday;
    } else {
      isHoliday = isDaysSame;
    }
    if (isHoliday) {
      holidayNames.push(holidays[i].title);
      break;
    }
  }
  return { isHoliday, holidayNames };
}

export function generateRecurringDates(
  recurringStartDate: Date,
  timezone: string,
  recurringDays: DaysOfWeek[],
  holidays: Holidays[],
  visitsByDay: Map<DaysOfWeek, Prisma.JsonObject[]>,
  durationInMinutes: number,
  skipOffset: boolean,
) {
  const generatedDates = generateDays(
    {
      offset: recurringStartDate,
      skipOffset,
      timezone,
    },
    recurringDays,
  );

  const result = [];

  generatedDates.forEach((date) => {
    const day = extractDay(date, timezone);
    const { isHoliday, holidayNames } = checkIfHoliday(
      date,
      holidays,
      timezone,
    );
    visitsByDay.get(day).forEach((visit) => {
      const time: string = visit.time as string;
      const [startingTime, meridien] = time.split(' ');
      const [hour, minute] = startingTime.split(':');
      const startingHour = parseInt(hour) + (meridien === 'PM' ? 12 : 0);
      const startingDateTimeWithFixedHour =
        extractZoneSpecificDateWithFixedHourTime(
          new Date(date),
          timezone,
          `T${startingHour >= 10 ? '' : '0'}${startingHour}:${
            minute.length === 1 ? '0' : ''
          }${minute}:00`,
        );

      const endingDateTimeWithFixedHour = addMinutes(
        new Date(startingDateTimeWithFixedHour),
        durationInMinutes,
      );
      result.push({
        date,
        day,
        isHoliday,
        holidayNames,
        visitStartTimeString: getZoneTimeString(
          new Date(startingDateTimeWithFixedHour),
          timezone,
        ),
        visitEndTimeString: getZoneTimeString(
          new Date(endingDateTimeWithFixedHour),
          timezone,
        ),
        visitStartInDateTime: new Date(startingDateTimeWithFixedHour),
        visitEndTimeInDateTime: new Date(endingDateTimeWithFixedHour),
        durationInMinutes,
      });
    });
  });
  return result;
}

export function generateDatesFromProposalVisits(
  recurringStartDate: Date,
  proposalVisits: VisitType[],
  timeZone: string,
  isRecurring: boolean,
) {
  const dates: Date[] = [];

  if (isRecurring) {
    const daysOfWeek = proposalVisits.map((visit) => visit.day);
    const recurringDays = daysOfWeek.map(
      (item: string) => item?.[0].toUpperCase() + item.slice(1),
    );

    const generatedDates = generateDays(
      {
        offset: recurringStartDate,
        skipOffset: false,
        timezone: timeZone,
      },
      recurringDays as DaysOfWeek[],
    );
    generatedDates.forEach((date) => {
      const day = extractDay(date, timeZone);
      const visit = proposalVisits.find(
        (visit) => visit.day === day.toLowerCase(),
      );
      if (visit) {
        visit.visits?.forEach((time) => {
          const countryDate = convertToZoneSpecificDateTime(
            date,
            timeZone,
            formatTimeFromMeridien(time),
          );
          if (countryDate.getTime() > recurringStartDate.getTime()) {
            dates.push(countryDate);
          }
        });
      }
    });
  } else {
    proposalVisits?.forEach((visit) => {
      visit.visits.forEach((time) => {
        const countryDate = convertToZoneSpecificDateTime(
          toDate(visit?.date, { timeZone }),
          timeZone,
          formatTimeFromMeridien(time),
        );

        dates.push(countryDate);
      });
    });
  }

  return dates;
}
