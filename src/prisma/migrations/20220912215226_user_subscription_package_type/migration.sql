/*
  Warnings:

  - Added the required column `packageType` to the `UserSubscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "userSubscriptionPackageTypeEnum" AS ENUM ('MONTHLY', 'YEARLY', 'HALF_YEARLY');

-- AlterTable
ALTER TABLE "UserSubscriptions" ADD COLUMN     "packageType" "userSubscriptionPackageTypeEnum" NOT NULL;
