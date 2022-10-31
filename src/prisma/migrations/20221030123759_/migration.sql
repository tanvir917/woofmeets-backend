/*
  Warnings:

  - You are about to drop the column `proposalOtherDate` on the `AppointmentProposal` table. All the data in the column will be lost.
  - You are about to drop the column `recurringSelectedDay` on the `AppointmentProposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppointmentProposal" DROP COLUMN "proposalOtherDate",
DROP COLUMN "recurringSelectedDay",
ADD COLUMN     "proposalOtherDates" TEXT[],
ADD COLUMN     "recurringSelectedDays" TEXT[];
