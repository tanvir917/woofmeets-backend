import { Holidays, Prisma } from '@prisma/client';
import { isAfter, isBefore, isSameDay } from 'date-fns';
import { toDate, utcToZonedTime } from 'date-fns-tz';
import { DaysOfWeek } from 'src/global';
import {
  extractZoneSpecificDateWithFirstHourTime,
  extractZoneSpecificDateWithFixedHourTime,
} from 'src/global/time/time-coverters';

export class DateType {
  date: string;
}

export class TimingType {
  dropOfStartTime: string;
  dropOfEndTime: string;
  pickUpStartTime: string;
  pickUpEndTime: string;
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
export const formatTimeFromMeridien = (date: string) => {
  const [startingTime, meridien] = date.split(' ');
  const [hour, minute] = startingTime.split(':');
  const startingHour = parseInt(hour) + (meridien === 'PM' ? 12 : 0);
  return `T${startingHour >= 10 ? '' : '0'}${startingHour}:${
    minute.length === 1 ? '0' : ''
  }${minute}:00`;
};

export const formatDatesWithStartEndTimings = (
  dates: Prisma.JsonValue[],
  timing: TimingType,
  timeZone: string,
) => {
  const dropOfStartTime = formatTimeFromMeridien(timing.dropOfStartTime);
  const pickUpEndTime = formatTimeFromMeridien(timing.pickUpEndTime);
  const formattedDates: DateType[] = [];
  const startDate = new Date((dates[0] as { date: string }).date.split('T')[0]);

  formattedDates.push({
    date: extractZoneSpecificDateWithFixedHourTime(
      startDate,
      timeZone,
      dropOfStartTime,
    ),
  });

  for (let i = 1; i < dates.length - 1; i++) {
    const currentDate = new Date(
      (dates[0] as { date: string }).date.split('T')[0],
    );
    formattedDates.push({
      date: extractZoneSpecificDateWithFirstHourTime(currentDate, timeZone),
    });
  }

  const endDate = new Date((dates[0] as { date: string }).date.split('T')[0]);
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
  dates: DateType[],
  holidays: Holidays[],
  timeZone: string,
) => {
  for (let i = 0; i < dates.length; i++) {
    for (let j = 0; j < holidays.length; j++) {
      const startDate = utcToZonedTime(
        toDate(holidays[j].startDate, { timeZone }),
        timeZone,
      );
      const endDate = utcToZonedTime(
        toDate(holidays[j].endDate, { timeZone }),
        timeZone,
      );
      const currentDate = new Date(dates[i].date);
      if (
        (isAfter(startDate, currentDate) && isBefore(endDate, currentDate)) ||
        isSameDay(startDate, currentDate) ||
        isSameDay(endDate, currentDate)
      ) {
        return true;
      }
    }
  }
  return false;
};
