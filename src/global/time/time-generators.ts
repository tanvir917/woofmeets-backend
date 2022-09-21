import { isAfter, addDays } from 'date-fns';
import { extractZoneSpecificDateWithFirstHourTime } from './time-coverters';

export const generateDatesFromAndTo = (
  from: Date,
  to: Date,
  dates: Date[],
): Date[] => {
  if (isAfter(from, to)) {
    return dates;
  }

  const nextDay = addDays(from, 1);
  return generateDatesFromAndTo(nextDay, to, [...dates, from]);
};

export const dateMaker = (
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
