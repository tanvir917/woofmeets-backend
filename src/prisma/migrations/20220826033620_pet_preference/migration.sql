/*
  Warnings:

  - You are about to drop the column `petPerDay` on the `ProviderServices` table. All the data in the column will be lost.
  - You are about to drop the `ServivePetType` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ProviderServices" DROP COLUMN "petPerDay";

-- DropTable
DROP TABLE "ServivePetType";

-- CreateTable
CREATE TABLE "ServicePetPreference" (
    "id" BIGSERIAL NOT NULL,
    "providerServicesId" BIGINT NOT NULL,
    "petPerDay" INTEGER NOT NULL DEFAULT 1,
    "smallDog" BOOLEAN NOT NULL DEFAULT true,
    "mediumDog" BOOLEAN NOT NULL DEFAULT true,
    "largeDog" BOOLEAN NOT NULL DEFAULT true,
    "giantDog" BOOLEAN NOT NULL DEFAULT true,
    "cat" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ServicePetPreference_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServicePetPreference" ADD CONSTRAINT "ServicePetPreference_providerServicesId_fkey" FOREIGN KEY ("providerServicesId") REFERENCES "ProviderServices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
