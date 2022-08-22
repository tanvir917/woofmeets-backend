-- CreateEnum
CREATE TYPE "backGroundCheckEnum" AS ENUM ('NONE', 'BASIC', 'ENHANCE');

-- CreateTable
CREATE TABLE "Provider" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "slug" TEXT NOT NULL,
    "havePets" BOOLEAN NOT NULL DEFAULT false,
    "quizPassed" BOOLEAN NOT NULL DEFAULT false,
    "photoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "backGroundCheck" "backGroundCheckEnum" NOT NULL DEFAULT 'NONE',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderServices" (
    "id" BIGSERIAL NOT NULL,
    "serviceTypeId" INTEGER NOT NULL,
    "providerId" BIGINT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAway" BOOLEAN NOT NULL DEFAULT false,
    "acceptsNewAppointments" BOOLEAN NOT NULL DEFAULT true,
    "acceptsNewCustomers" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "petPerDay" INTEGER NOT NULL DEFAULT 1,
    "logStay" BOOLEAN NOT NULL DEFAULT true,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProviderServices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_slug_key" ON "Provider"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderServices_slug_key" ON "ProviderServices"("slug");

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderServices" ADD CONSTRAINT "ProviderServices_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "ServiceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderServices" ADD CONSTRAINT "ProviderServices_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
