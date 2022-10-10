import { addDays } from 'date-fns';

export type DaysOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

export class DateGeneratorOpts {
  /**
   * @description - The start date for which the slots for the corresponding
   * week will be generated
   */
  offset: Date = new Date();
  /**
   * @description - the timezone against which the calculations must occur
   */
  timezone: string;

  /**
   * @description - should the offset date should be skipped or not
   */
  skipOffset = true;
}
export const extractDay = (date: Date, timezone: string) =>
  Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).format(date) as DaysOfWeek;

export function generateRemainingDaysInWeek(
  offset: Date,
  timeZone: string,
  until: DaysOfWeek = 'Sun',
): Date[] {
  const dates: Date[] = [];

  let [cursorDate, cursorDay] = [offset, extractDay(offset, timeZone)];

  let counter = 0;

  const limit = cursorDay == 'Sun' ? 1 : 0;

  while (cursorDay != until || counter < limit) {
    dates.push(cursorDate);
    cursorDate = addDays(cursorDate, 1);
    cursorDay = extractDay(cursorDate, timeZone);
    counter++;
  }

  return dates;
}

/**
 * @param {Date[]} dates
 * @param {Set<DaysOfWeek>} days
 * @param {string} zone  - IANA zone string
 * @returns {Date[]}
 */
export function getMatchedDays(
  dates: Date[],
  days: Set<DaysOfWeek>,
  zone: string,
): Date[] {
  const result: Set<Date> = new Set();

  dates.forEach((item) => {
    const targetDay = extractDay(item, zone);
    if (days.has(targetDay)) {
      result.add(item);
    }
  });

  return [...result];
}

/**
 * @param {DateGeneratorOpts} opts  - Specify opts such as skipping current date
 * @param {DaysOfWeek} generateFor  - The days for which the remaining dates should be generated for
 * @returns {Date[]}
 */
export function generateDays(
  opts: DateGeneratorOpts,
  generateFor: DaysOfWeek[],
): Date[] {
  const { offset, skipOffset, timezone } = opts;

  const daysSet = new Set<DaysOfWeek>([...generateFor]);

  const cursorDate = skipOffset ? addDays(offset, 1) : offset;

  // dates remaining in current Week
  const datesRemainingInCW: Date[] = generateRemainingDaysInWeek(
    cursorDate,
    timezone,
    'Sun',
  );

  // dates for which the days are included in the generateFor array
  const matchedDatesInCW = getMatchedDays(
    datesRemainingInCW,
    daysSet,
    timezone,
  );

  if (matchedDatesInCW.length > 0) {
    return matchedDatesInCW;
  }

  // generate all days in next week
  const nextWeek = generateRemainingDaysInWeek(
    addDays(datesRemainingInCW[datesRemainingInCW.length - 1], 1),
    timezone,
    'Sun',
  );

  // return dates in next week for all the matched days
  return getMatchedDays(nextWeek, daysSet, timezone);
}
