-- CreateEnum
CREATE TYPE "cancelledByAppointmentEnum" AS ENUM ('PROVIDER', 'USER');

-- CreateEnum
CREATE TYPE "refundStatusEnum" AS ENUM ('PENDING', 'REFUND');

-- CreateTable
CREATE TABLE "CancelAppointment" (
    "id" BIGSERIAL NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "cancellationPolicyId" INTEGER,
    "refundStatus" "refundStatusEnum" NOT NULL DEFAULT 'PENDING',
    "cancelledBy" "cancelledByAppointmentEnum" NOT NULL,
    "paidTo" "appointmentProposalEnum" NOT NULL,
    "dayRemainingBeforeAppointment" INTEGER,
    "userRefundAmount" DOUBLE PRECISION,
    "userRefundPercentage" DOUBLE PRECISION,
    "providerRemainingAppointmentVisits" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CancelAppointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CancelAppointment" ADD CONSTRAINT "CancelAppointment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CancelAppointment" ADD CONSTRAINT "CancelAppointment_cancellationPolicyId_fkey" FOREIGN KEY ("cancellationPolicyId") REFERENCES "CancellationPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
