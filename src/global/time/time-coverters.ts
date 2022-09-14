import { PrismaClient } from '@prisma/client';
import { formatInTimeZone, toDate, format, utcToZonedTime } from 'date-fns-tz';

export const timeFormatHelper = (
  date: Date,
  dateFormat: string,
  zone: string,
): string => {
  return formatInTimeZone(date, zone, dateFormat);
};

export const extractZoneSpecificDate = (date: Date, zone: string) =>
  timeFormatHelper(date, 'yyyy-MM-dd', zone);

export const extractZoneSpecificDateWithFirstHourTime = (
  date: Date,
  zone: string,
) => {
  const formattedDateTime = timeFormatHelper(date, 'yyyy-MM-dd', zone).concat(
    'T00:00:00',
  );

  const parsedDate = toDate(formattedDateTime, {
    timeZone: zone,
  });

  const countryDate = utcToZonedTime(parsedDate, zone);
  return format(countryDate, 'yyyy-MM-dd HH:mm:ssxxx', { timeZone: zone });
};

export const getDatabaseTimezone = async (prisma: PrismaClient) => {
  const databaseSettings = await prisma.$queryRaw<
    {
      current_setting: string;
    }[]
  >`SELECT current_setting('TIMEZONE');`;

  return databaseSettings[0]?.current_setting;
};

export const isSameDate = (date1: Date, date2: Date, zone?: string) => {
  return (
    extractZoneSpecificDate(date1, zone ?? 'Etc/UTC') ===
    extractZoneSpecificDate(date2, zone ?? 'Etc/UTC')
  );
};
