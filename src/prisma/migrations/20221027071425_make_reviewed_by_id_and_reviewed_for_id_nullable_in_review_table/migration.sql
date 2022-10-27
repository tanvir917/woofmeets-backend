-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_reviewedById_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_reviewedForId_fkey";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "reviewedById" DROP NOT NULL,
ALTER COLUMN "reviewedById" DROP DEFAULT,
ALTER COLUMN "reviewedForId" DROP NOT NULL,
ALTER COLUMN "reviewedForId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewedForId_fkey" FOREIGN KEY ("reviewedForId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
