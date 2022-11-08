/*
  Warnings:

  - You are about to drop the column `precessingId` on the `AppointmentBillingTransactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppointmentBillingTransactions" DROP COLUMN "precessingId",
ADD COLUMN     "lockedAt" TIMESTAMPTZ(3),
ADD COLUMN     "nextState" TEXT,
ADD COLUMN     "processingId" TEXT,
ADD COLUMN     "state" TEXT NOT NULL DEFAULT 'CUSTOMER_PAID';
