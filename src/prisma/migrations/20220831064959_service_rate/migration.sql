/*
  Warnings:

  - You are about to drop the `ServiceRates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceRates" DROP CONSTRAINT "ServiceRates_providerServicesId_fkey";

-- DropTable
DROP TABLE "ServiceRates";

-- CreateTable
CREATE TABLE "ServiceRateType" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "unitRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCurrency" TEXT NOT NULL DEFAULT 'usd',
    "unitLabel" TEXT NOT NULL DEFAULT 'night',
    "unit" INTEGER NOT NULL DEFAULT 1,
    "helpText" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ServiceRateType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTypeHasRates" (
    "id" BIGSERIAL NOT NULL,
    "serviceTypeId" INTEGER NOT NULL,
    "serviceRateTypeId" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ServiceTypeHasRates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceHasRates" (
    "id" BIGSERIAL NOT NULL,
    "providerServicesId" BIGINT NOT NULL,
    "serviceTypeHasRatesId" BIGINT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ServiceHasRates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceTypeHasRates" ADD CONSTRAINT "ServiceTypeHasRates_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTypeHasRates" ADD CONSTRAINT "ServiceTypeHasRates_serviceRateTypeId_fkey" FOREIGN KEY ("serviceRateTypeId") REFERENCES "ServiceRateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHasRates" ADD CONSTRAINT "ServiceHasRates_providerServicesId_fkey" FOREIGN KEY ("providerServicesId") REFERENCES "ProviderServices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceHasRates" ADD CONSTRAINT "ServiceHasRates_serviceTypeHasRatesId_fkey" FOREIGN KEY ("serviceTypeHasRatesId") REFERENCES "ServiceTypeHasRates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
