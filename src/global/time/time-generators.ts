import { isAfter, addDays } from 'date-fns';

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
