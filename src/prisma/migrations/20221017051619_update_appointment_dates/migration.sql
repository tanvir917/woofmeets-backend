/*
  Warnings:

  - Added the required column `day` to the `AppointmentDates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isHoliday` to the `AppointmentDates` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AppointmentDates" ADD COLUMN     "day" TEXT NOT NULL,
ADD COLUMN     "isHoliday" BOOLEAN NOT NULL;
