-- CreateTable
CREATE TABLE "AppointmentCard" (
    "id" BIGSERIAL NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "appointmentDateId" BIGINT,
    "images" JSONB[],
    "petsData" JSONB[],
    "medication" TEXT,
    "additionalNotes" TEXT,
    "totalWalkTime" TEXT,
    "distance" DOUBLE PRECISION,
    "distanceUnit" TEXT DEFAULT 'mi',
    "generateTime" TIMESTAMP(3),
    "submitTime" TIMESTAMP(3),
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentCard_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppointmentCard" ADD CONSTRAINT "AppointmentCard_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentCard" ADD CONSTRAINT "AppointmentCard_appointmentDateId_fkey" FOREIGN KEY ("appointmentDateId") REFERENCES "AppointmentDates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
