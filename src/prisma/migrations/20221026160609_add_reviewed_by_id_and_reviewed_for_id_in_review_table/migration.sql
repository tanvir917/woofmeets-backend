/*
  Warnings:

  - Added the required column `reviewedById` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewedForId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "reviewedById" BIGINT NOT NULL,
ADD COLUMN     "reviewedForId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedForId_fkey" FOREIGN KEY ("reviewedForId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
