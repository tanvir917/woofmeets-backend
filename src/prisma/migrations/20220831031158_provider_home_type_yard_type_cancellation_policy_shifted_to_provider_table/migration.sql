/*
  Warnings:

  - You are about to drop the column `cancellationPolicyId` on the `ProviderServices` table. All the data in the column will be lost.
  - You are about to drop the column `homeType` on the `ProviderServices` table. All the data in the column will be lost.
  - You are about to drop the column `yardType` on the `ProviderServices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProviderServices" DROP CONSTRAINT "ProviderServices_cancellationPolicyId_fkey";

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "cancellationPolicyId" INTEGER,
ADD COLUMN     "homeType" "homeTypeEnum" NOT NULL DEFAULT 'NOT_SELECTED',
ADD COLUMN     "yardType" "yardTypeEnum" NOT NULL DEFAULT 'NOT_SELECTED';

-- AlterTable
ALTER TABLE "ProviderServices" DROP COLUMN "cancellationPolicyId",
DROP COLUMN "homeType",
DROP COLUMN "yardType";

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_cancellationPolicyId_fkey" FOREIGN KEY ("cancellationPolicyId") REFERENCES "CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
