/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `User` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loginProvider` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `opk` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "loginProvider" AS ENUM ('LOCAL', 'FACEBOOK', 'GOOGLE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "provider",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN DEFAULT true,
ADD COLUMN     "facebook" TEXT,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "google" BOOLEAN,
ADD COLUMN     "image" JSONB,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "loginProvider" "loginProvider" NOT NULL,
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "opk" TEXT NOT NULL,
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "zipcode" TEXT,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;
