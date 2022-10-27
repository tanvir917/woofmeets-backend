-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "providerServiceComment" TEXT,
ADD COLUMN     "providerServiceId" BIGINT,
ADD COLUMN     "providerServiceRating" DOUBLE PRECISION;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "ProviderServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
