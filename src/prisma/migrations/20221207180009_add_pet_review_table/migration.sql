-- CreateTable
CREATE TABLE "PetReview" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT,
    "providerId" BIGINT,
    "appointmentId" BIGINT,
    "petId" BIGINT,
    "rating" DOUBLE PRECISION,
    "comment" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PetReview_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PetReview" ADD CONSTRAINT "PetReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetReview" ADD CONSTRAINT "PetReview_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetReview" ADD CONSTRAINT "PetReview_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetReview" ADD CONSTRAINT "PetReview_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
