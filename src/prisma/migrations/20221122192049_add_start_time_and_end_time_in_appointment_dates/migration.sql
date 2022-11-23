-- AlterTable
ALTER TABLE "AppointmentDates" ADD COLUMN     "startTime" TIMESTAMPTZ(3),
ADD COLUMN     "stopTime" TIMESTAMPTZ(3);
