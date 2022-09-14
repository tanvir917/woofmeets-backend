/*
  Warnings:

  - You are about to drop the column `clientSecret` on the `UserSubscriptionInvoices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userSubscriptionId]` on the table `UserSubscriptionInvoices` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[piId]` on the table `UserSubscriptionInvoices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserSubscriptionInvoices" DROP COLUMN "clientSecret",
ADD COLUMN     "chargeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscriptionInvoices_userSubscriptionId_key" ON "UserSubscriptionInvoices"("userSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscriptionInvoices_piId_key" ON "UserSubscriptionInvoices"("piId");
