import { toDate, utcToZonedTime } from 'date-fns-tz';
import { DaysOfWeek, extractDay, generateDays } from '../date-generator';
import { generateDatesFromAndTo } from '../time-generators';

const timeZone = 'Asia/Dhaka';
const getZonedTestDate = (date: string, timeZone) =>
  utcToZonedTime(toDate(date), timeZone);
describe('Test date generator', () => {
  it('Generate mon,tue', () => {
    const days: DaysOfWeek[] = ['Tue', 'Wed', 'Thu', 'Mon'];
    const result = generateDays(
      {
        offset: getZonedTestDate('2022-11-01T00:00:00', timeZone),
        skipOffset: false,
        timezone: timeZone,
      },
      days,
    );
    result.forEach((date, i) => {
      expect(extractDay(date, timeZone)).toBe(days[i]);
    });
  });
  it('Generate dates to and from', () => {
    const from = getZonedTestDate('2022-11-01T00:00:00', timeZone);
    const to = getZonedTestDate('2022-11-03T00:00:00', timeZone);
    const result = generateDatesFromAndTo(from, to, []);
    console.log({ result });
    const expectedDates = [
      new Date('2022-10-31T18:00:00.000Z'),
      new Date('2022-11-01T18:00:00.000Z'),
      new Date('2022-11-02T18:00:00.000Z'),
    ];
    result.forEach((date, i) => {
      expect(date.toISOString()).toBe(expectedDates[i].toISOString());
    });
  });
});
