-- CreateTable
CREATE TABLE "AppointmentDays" (
    "id" BIGSERIAL NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "proposalId" BIGINT NOT NULL,
    "paymentStatus" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "generatedTill" TIMESTAMP(3),
    "dates" JSONB[],
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentDays_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppointmentDays" ADD CONSTRAINT "AppointmentDays_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentDays" ADD CONSTRAINT "AppointmentDays_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AppointmentProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
