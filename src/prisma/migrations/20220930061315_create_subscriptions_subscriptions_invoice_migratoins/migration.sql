/*
  Warnings:

  - You are about to drop the column `chargeId` on the `UserSubscriptionInvoices` table. All the data in the column will be lost.
  - You are about to drop the column `piId` on the `UserSubscriptionInvoices` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `UserSubscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `packageType` on the `UserSubscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `subTotal` on the `UserSubscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `UserSubscriptions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeInvoiceId]` on the table `UserSubscriptionInvoices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `billingReason` to the `UserSubscriptionInvoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeInvoiceId` to the `UserSubscriptionInvoices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subTotal` to the `UserSubscriptionInvoices` table without a default value. This is not possible if the table is not empty.
  - Made the column `currency` on table `UserSubscriptionInvoices` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `status` on the `UserSubscriptionInvoices` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "clientSubscriptonsInvoiceStatus" AS ENUM ('draft', 'open', 'paid', 'uncollectible', 'void');

-- DropIndex
DROP INDEX "UserSubscriptionInvoices_piId_key";

-- AlterTable
ALTER TABLE "UserSubscriptionInvoices" DROP COLUMN "chargeId",
DROP COLUMN "piId",
ADD COLUMN     "amountDue" DOUBLE PRECISION,
ADD COLUMN     "amountPaid" DOUBLE PRECISION,
ADD COLUMN     "amountRemaining" DOUBLE PRECISION,
ADD COLUMN     "billingReason" TEXT NOT NULL,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerStripeId" TEXT,
ADD COLUMN     "invoicePdf" TEXT,
ADD COLUMN     "stripeInvoiceId" TEXT NOT NULL,
ADD COLUMN     "subTotal" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "currency" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "clientSubscriptonsInvoiceStatus" NOT NULL;

-- AlterTable
ALTER TABLE "UserSubscriptions" DROP COLUMN "discount",
DROP COLUMN "packageType",
DROP COLUMN "subTotal",
DROP COLUMN "total";

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscriptionInvoices_stripeInvoiceId_key" ON "UserSubscriptionInvoices"("stripeInvoiceId");
