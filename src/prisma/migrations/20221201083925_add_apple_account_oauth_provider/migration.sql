-- AlterEnum
ALTER TYPE "loginProvider" ADD VALUE 'APPLE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "appleAccountId" TEXT;
