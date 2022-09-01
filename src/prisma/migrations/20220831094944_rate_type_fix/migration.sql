/*
  Warnings:

  - You are about to drop the column `unitRate` on the `ServiceRateType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ServiceRateType" DROP COLUMN "unitRate",
ADD COLUMN     "meta" JSONB;
