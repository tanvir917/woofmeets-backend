-- CreateTable
CREATE TABLE "AvailableDate" (
    "id" BIGSERIAL NOT NULL,
    "serviceId" BIGINT,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "userId" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AvailableDate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AvailableDate" ADD CONSTRAINT "AvailableDate_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ProviderServices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailableDate" ADD CONSTRAINT "AvailableDate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
