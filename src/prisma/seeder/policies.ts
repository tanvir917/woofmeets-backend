export const mappedPolicies = [
  {
    slug: 'same_day',
    title: 'Same Day',
    time: 0,
    percentage: 100,
    sequence: 1,
    details: 'Cancellation on the same day',
  },
  {
    slug: 'one_day',
    title: 'One Day',
    time: 1,
    percentage: 100,
    sequence: 2,
    details: 'Cancellation on 1 day before the service date',
  },
  {
    slug: 'three_day',
    title: 'Three Day',
    time: 3,
    percentage: 100,
    sequence: 3,
    details: 'Cancellation on 3 days before the service date',
  },
  {
    slug: 'seven_day',
    title: 'Seven Day',
    time: 7,
    percentage: 100,
    sequence: 4,
    details: 'Cancellation on 7 days before the service date',
  },
];
