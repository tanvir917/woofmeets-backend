import { extractDay, generateDays } from '../date-generator';

describe('Test date generator', () => {
  it('Generate mon,tue', () => {
    const case1 = generateDays(
      {
        offset: new Date('2022-10-10T02:39:30.198Z'),
        skipOffset: true,
        timezone: 'America/New_York',
      },
      ['Mon', 'Wed'],
    );

    expect(extractDay(case1[0], 'America/New_York')).toBe('Mon');
    expect(extractDay(case1[1], 'America/New_York')).toBe('Wed');
  });
});
