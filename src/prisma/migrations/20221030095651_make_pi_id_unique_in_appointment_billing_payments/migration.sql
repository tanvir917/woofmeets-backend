/*
  Warnings:

  - A unique constraint covering the columns `[piId]` on the table `AppointmentBillingPayments` will be added. If there are existing duplicate values, this will fail.
  - Made the column `piId` on table `AppointmentBillingPayments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AppointmentBillingPayments" ALTER COLUMN "piId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentBillingPayments_piId_key" ON "AppointmentBillingPayments"("piId");
