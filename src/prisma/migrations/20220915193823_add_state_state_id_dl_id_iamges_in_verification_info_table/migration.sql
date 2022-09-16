/*
  Warnings:

  - You are about to drop the column `dlOrIdImage` on the `UserBasicVerification` table. All the data in the column will be lost.
  - You are about to drop the column `idNumber` on the `UserBasicVerification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserBasicVerification" DROP COLUMN "dlOrIdImage",
DROP COLUMN "idNumber",
ADD COLUMN     "dlId" TEXT,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stateId" TEXT;
