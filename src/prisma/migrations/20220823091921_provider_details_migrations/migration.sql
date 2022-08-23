-- CreateTable
CREATE TABLE "ProviderDetails" (
    "id" BIGSERIAL NOT NULL,
    "providerId" BIGINT NOT NULL,
    "headline" TEXT NOT NULL,
    "yearsOfExperience" DOUBLE PRECISION NOT NULL,
    "dogsExperience" TEXT,
    "walkingExperience" TEXT,
    "requestedDogInfo" TEXT,
    "experienceDescription" TEXT NOT NULL,
    "environmentDescription" TEXT NOT NULL,
    "scheduleDescription" TEXT NOT NULL,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProviderDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderDetails_providerId_key" ON "ProviderDetails"("providerId");

-- AddForeignKey
ALTER TABLE "ProviderDetails" ADD CONSTRAINT "ProviderDetails_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
