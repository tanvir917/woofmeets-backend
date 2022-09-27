/*
  Warnings:

  - The values [ACTIVE,INACTIVE,ENDED,CANCELLED] on the enum `userSubscriptionStatusEnum` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `UserSubscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "userSubscriptionStatusEnum_new" AS ENUM ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid');
ALTER TABLE "UserSubscriptions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "UserSubscriptions" ALTER COLUMN "status" TYPE "userSubscriptionStatusEnum_new" USING ("status"::text::"userSubscriptionStatusEnum_new");
ALTER TYPE "userSubscriptionStatusEnum" RENAME TO "userSubscriptionStatusEnum_old";
ALTER TYPE "userSubscriptionStatusEnum_new" RENAME TO "userSubscriptionStatusEnum";
DROP TYPE "userSubscriptionStatusEnum_old";
COMMIT;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "annualPriceId" TEXT,
ADD COLUMN     "monthlyPriceId" TEXT;

-- AlterTable
ALTER TABLE "UserSubscriptions" ADD COLUMN     "stripeSubscriptionId" TEXT,
ALTER COLUMN "status" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscriptions_stripeSubscriptionId_key" ON "UserSubscriptions"("stripeSubscriptionId");
