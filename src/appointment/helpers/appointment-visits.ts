import { Prisma } from '@prisma/client';
import { DaysOfWeek } from 'src/global';

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
