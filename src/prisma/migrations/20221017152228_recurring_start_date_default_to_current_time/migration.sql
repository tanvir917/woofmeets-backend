/*
  Warnings:

  - The `recurringStartDate` column on the `AppointmentProposal` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AppointmentProposal" DROP COLUMN "recurringStartDate",
ADD COLUMN     "recurringStartDate" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
