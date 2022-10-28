import { PrismaClient } from '@prisma/client';
import { format, formatInTimeZone, toDate, utcToZonedTime } from 'date-fns-tz';

export const timeFormatHelper = (
  date: Date,
  dateFormat: string,
  zone: string,
): string => {
  return formatInTimeZone(date, zone, dateFormat);
};

export const extractZoneSpecificDate = (date: Date, zone: string) =>
  timeFormatHelper(date, 'yyyy-MM-dd', zone);

export const convertToZoneSpecificDateTime = (
  date: Date,
  zone: string,
  time = 'T00:00:00',
) => {
  const formattedDateTime = timeFormatHelper(date, 'yyyy-MM-dd', zone).concat(
    time,
  );

  const parsedDate = toDate(formattedDateTime, {
    timeZone: zone,
  });

  const countryDate = utcToZonedTime(parsedDate, zone);
  return countryDate;
};

export const extractZoneSpecificDateWithFirstHourTime = (
  date: Date,
  zone: string,
) => {
  const countryDate = convertToZoneSpecificDateTime(date, zone);

  return format(countryDate, 'yyyy-MM-dd HH:mm:ssxxx', { timeZone: zone });
};

export const extractZoneSpecificDateWithFixedHourTime = (
  date: Date,
  zone: string,
  time = 'T00:00:00',
) => {
  const countryDate = convertToZoneSpecificDateTime(date, zone, time);

  return format(countryDate, 'yyyy-MM-dd HH:mm:ssxxx', { timeZone: zone });
};

export const getZoneTimeString = (date: Date, timeZone: string) => {
  return format(utcToZonedTime(date, timeZone), 'KK:mm a', {
    timeZone,
  });
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
