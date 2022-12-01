import { Holidays } from '@prisma/client';
import { addMinutes, isAfter, isBefore, isSameDay } from 'date-fns';
import { format, toDate, utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { DaysOfWeek, extractDay, generateDays } from 'src/global';
import { convertToZoneSpecificDateTime } from 'src/global/time/time-coverters';

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

export class HolidayType {
  title: string;
  startDate: string;
  endDate: string;
  timeZone: string;
}

export const formatTimeFromMeridien = (time: string) => {
  const [startingTime, meridien] = time.split(' ');
  const [hour, minute] = startingTime.split(':');
  const startingHour = parseInt(hour) + (meridien === 'PM' ? 12 : 0);
  return `T${startingHour >= 10 ? '' : '0'}${startingHour}:${
    minute.length === 1 ? '0' : ''
  }${minute}:00`;
};

export const checkIfAnyDateHoliday = (
  dates: Date[],
  holidays: Holidays[],
  timeZone: string,
  minutes: number,
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
      date: dates[i],
      localDateTime: format(dates[i], 'yyyy-MM-dd HH:mm:ssxxx KK:mma', {
        timeZone,
      }),
      localDate: format(dates[i], 'yyyy-MM-dd', {
        timeZone,
      }),
      startTime: format(dates[i], 'KK:mma', {
        timeZone,
      }),
      endTime: format(addMinutes(dates[i], minutes), 'KK:mma', {
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
            zonedTimeToUtc(date, timeZone),
            timeZone,
            formatTimeFromMeridien(time),
          );
          const currentZonedTime = utcToZonedTime(new Date(), timeZone);
          if (countryDate.getTime() >= currentZonedTime.getTime()) {
            dates.push(countryDate);
          }
          // dates.push(countryDate);
        });
      }
    });
  } else {
    proposalVisits?.forEach((visit) => {
      visit.visits.forEach((time) => {
        const countryDate = convertToZoneSpecificDateTime(
          zonedTimeToUtc(visit?.date, timeZone),
          timeZone,
          formatTimeFromMeridien(time),
        );
        const currentZonedTime = utcToZonedTime(new Date(), timeZone);
        if (countryDate.getTime() >= currentZonedTime.getTime()) {
          dates.push(countryDate);
        }
        // dates.push(countryDate);
      });
    });
  }

  return dates;
}
