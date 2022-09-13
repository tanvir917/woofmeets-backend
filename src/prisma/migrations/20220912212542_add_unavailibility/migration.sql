-- CreateTable
CREATE TABLE "Unavailability" (
    "id" BIGSERIAL NOT NULL,
    "serviceId" BIGINT,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "allServicesInactive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Unavailability_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Unavailability" ADD CONSTRAINT "Unavailability_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ProviderServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
