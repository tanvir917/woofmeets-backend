/*
  Warnings:

  - The `proposalVisits` column on the `AppointmentProposal` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AppointmentProposal" DROP COLUMN "proposalVisits",
ADD COLUMN     "proposalVisits" JSONB[];
