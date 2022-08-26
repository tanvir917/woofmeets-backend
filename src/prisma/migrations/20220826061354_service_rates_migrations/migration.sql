-- CreateTable
CREATE TABLE "ServiceRates" (
    "id" BIGSERIAL NOT NULL,
    "providerServicesId" BIGINT NOT NULL,
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

    CONSTRAINT "ServiceRates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceRates" ADD CONSTRAINT "ServiceRates_providerServicesId_fkey" FOREIGN KEY ("providerServicesId") REFERENCES "ProviderServices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
