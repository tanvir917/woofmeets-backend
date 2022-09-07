-- AlterTable
ALTER TABLE "ProviderServices" ADD COLUMN     "advanceNotice" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pottyBreak" TEXT;

-- CreateTable
CREATE TABLE "AvailableDay" (
    "id" BIGSERIAL NOT NULL,
    "providerServiceId" BIGINT NOT NULL,
    "sat" BOOLEAN NOT NULL DEFAULT false,
    "sun" BOOLEAN NOT NULL DEFAULT false,
    "mon" BOOLEAN NOT NULL DEFAULT false,
    "tue" BOOLEAN NOT NULL DEFAULT false,
    "wed" BOOLEAN NOT NULL DEFAULT false,
    "thu" BOOLEAN NOT NULL DEFAULT false,
    "fri" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AvailableDay_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AvailableDay" ADD CONSTRAINT "AvailableDay_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "ProviderServices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
