/*
  Warnings:

  - You are about to drop the column `petQuantity` on the `AppointmentProposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppointmentProposal" DROP COLUMN "petQuantity",
ADD COLUMN     "petsIds" JSONB;

-- AlterTable
ALTER TABLE "Holidays" ALTER COLUMN "startDate" SET DATA TYPE TEXT,
ALTER COLUMN "endDate" SET DATA TYPE TEXT;
