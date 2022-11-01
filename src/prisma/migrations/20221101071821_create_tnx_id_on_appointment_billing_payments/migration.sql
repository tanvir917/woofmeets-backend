/*
  Warnings:

  - A unique constraint covering the columns `[txnId]` on the table `AppointmentBillingPayments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AppointmentBillingPayments" ADD COLUMN     "txnId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentBillingPayments_txnId_key" ON "AppointmentBillingPayments"("txnId");
