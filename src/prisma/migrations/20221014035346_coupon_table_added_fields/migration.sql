/*
  Warnings:

  - You are about to drop the column `expriesAt` on the `Coupons` table. All the data in the column will be lost.
  - You are about to drop the column `public` on the `Coupons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Coupons" DROP COLUMN "expriesAt",
DROP COLUMN "public",
ADD COLUMN     "expiresAt" TIMESTAMPTZ(3),
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;
