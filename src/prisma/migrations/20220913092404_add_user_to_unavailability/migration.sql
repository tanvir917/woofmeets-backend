/*
  Warnings:

  - Added the required column `userId` to the `Unavailability` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Unavailability" ADD COLUMN     "userId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "Unavailability" ADD CONSTRAINT "Unavailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
