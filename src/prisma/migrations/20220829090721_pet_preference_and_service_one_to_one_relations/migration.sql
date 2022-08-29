/*
  Warnings:

  - A unique constraint covering the columns `[providerServicesId]` on the table `ServicePetPreference` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ServicePetPreference_providerServicesId_key" ON "ServicePetPreference"("providerServicesId");
