/*
  Warnings:

  - You are about to drop the column `userId` on the `UserApplicationVersion` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserApplicationVersion" DROP CONSTRAINT "UserApplicationVersion_userId_fkey";

-- DropIndex
DROP INDEX "UserApplicationVersion_userId_key";

-- AlterTable
ALTER TABLE "UserApplicationVersion" DROP COLUMN "userId",
ADD COLUMN     "androidForceUpdateVersion" TEXT,
ADD COLUMN     "iosForceUpdateVersion" TEXT,
ALTER COLUMN "version" DROP NOT NULL;
