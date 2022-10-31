/*
  Warnings:

  - You are about to drop the column `proposalOtherDates` on the `AppointmentProposal` table. All the data in the column will be lost.
  - You are about to drop the column `recurringSelectedDays` on the `AppointmentProposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppointmentProposal" DROP COLUMN "proposalOtherDates",
DROP COLUMN "recurringSelectedDays",
ADD COLUMN     "proposalOtherDate" TEXT[],
ADD COLUMN     "recurringSelectedDay" TEXT[];
