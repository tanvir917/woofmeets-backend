/*
  Warnings:

  - You are about to drop the column `cropRate` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `SubscriptionPlan` table. All the data in the column will be lost.
  - You are about to drop the `UserSubscriptionPlanInfo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `annualRate` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monthlyRate` to the `SubscriptionPlan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "userSubscriptionStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'ENDED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "UserSubscriptionPlanInfo" DROP CONSTRAINT "UserSubscriptionPlanInfo_cardId_fkey";

-- DropForeignKey
ALTER TABLE "UserSubscriptionPlanInfo" DROP CONSTRAINT "UserSubscriptionPlanInfo_subscriptionPlanId_fkey";

-- DropForeignKey
ALTER TABLE "UserSubscriptionPlanInfo" DROP CONSTRAINT "UserSubscriptionPlanInfo_userId_fkey";

-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "cropRate",
DROP COLUMN "discount",
DROP COLUMN "rate",
ADD COLUMN     "annualCropRate" DOUBLE PRECISION,
ADD COLUMN     "annualRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "monthlyCropRate" DOUBLE PRECISION,
ADD COLUMN     "monthlyRate" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "UserSubscriptionPlanInfo";

-- CreateTable
CREATE TABLE "UserSubscriptions" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "subscriptionPlanId" BIGINT NOT NULL,
    "cardId" BIGINT,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT,
    "currentPeriodStart" TIMESTAMPTZ(3),
    "currentPeriodEnd" TIMESTAMPTZ(3),
    "status" "userSubscriptionStatusEnum" NOT NULL DEFAULT 'INACTIVE',
    "paymentStatus" TEXT,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "UserSubscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscriptionInvoices" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "userSubscriptionId" BIGINT NOT NULL,
    "piId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "billingDate" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "UserSubscriptionInvoices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSubscriptions" ADD CONSTRAINT "UserSubscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptions" ADD CONSTRAINT "UserSubscriptions_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptions" ADD CONSTRAINT "UserSubscriptions_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "UserStripeCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptionInvoices" ADD CONSTRAINT "UserSubscriptionInvoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptionInvoices" ADD CONSTRAINT "UserSubscriptionInvoices_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
