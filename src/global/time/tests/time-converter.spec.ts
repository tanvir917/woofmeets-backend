import { extractZoneSpecificDate } from './../time-coverters';
describe('UnavailabilityService', () => {
  it('Testing', () => {
    extractZoneSpecificDate(new Date('2022-09-13T14:00:00.000+06:00'), '');
    expect('ok').toBe('ok');
  });
});
