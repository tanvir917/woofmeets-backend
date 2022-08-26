/*
  Warnings:

  - The `havePets` column on the `Provider` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "subscriptionTypeEnum" AS ENUM ('BASIC', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "havePetsEnum" AS ENUM ('NOT_SELECTED', 'YES', 'NO');

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionType" "subscriptionTypeEnum" NOT NULL DEFAULT 'BASIC',
DROP COLUMN "havePets",
ADD COLUMN     "havePets" "havePetsEnum" NOT NULL DEFAULT 'NOT_SELECTED';
