/*
  Warnings:

  - You are about to drop the column `providerServicesId` on the `ServicePetPreference` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[providerId]` on the table `ServicePetPreference` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `ServicePetPreference` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ServicePetPreference" DROP CONSTRAINT "ServicePetPreference_providerServicesId_fkey";

-- DropIndex
DROP INDEX "ServicePetPreference_providerServicesId_key";

-- AlterTable
ALTER TABLE "ServicePetPreference" DROP COLUMN "providerServicesId",
ADD COLUMN     "providerId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ServicePetPreference_providerId_key" ON "ServicePetPreference"("providerId");

-- AddForeignKey
ALTER TABLE "ServicePetPreference" ADD CONSTRAINT "ServicePetPreference_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
