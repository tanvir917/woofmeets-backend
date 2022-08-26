-- CreateEnum
CREATE TYPE "homeTypeEnum" AS ENUM ('NOT_SELECTED', 'HOUSE', 'APARTMENT', 'FARM');

-- CreateEnum
CREATE TYPE "yardTypeEnum" AS ENUM ('NOT_SELECTED', 'FENCED', 'UNFENCED', 'NO_YARD');

-- AlterTable
ALTER TABLE "ProviderServices" ADD COLUMN     "cancellationPolicyId" INTEGER,
ADD COLUMN     "homeType" "homeTypeEnum" NOT NULL DEFAULT 'NOT_SELECTED',
ADD COLUMN     "yardType" "yardTypeEnum" NOT NULL DEFAULT 'NOT_SELECTED';

-- AddForeignKey
ALTER TABLE "ProviderServices" ADD CONSTRAINT "ProviderServices_cancellationPolicyId_fkey" FOREIGN KEY ("cancellationPolicyId") REFERENCES "CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
