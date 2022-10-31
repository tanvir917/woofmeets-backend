/*
  Warnings:

  - The `proposalOtherDate` column on the `AppointmentProposal` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AppointmentProposal" DROP COLUMN "proposalOtherDate",
ADD COLUMN     "proposalOtherDate" JSONB[];
