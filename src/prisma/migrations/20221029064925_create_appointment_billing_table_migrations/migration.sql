-- CreateTable
CREATE TABLE "Billing" (
    "id" BIGSERIAL NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "totalDayCount" INTEGER,
    "subtotal" DOUBLE PRECISION,
    "serviceCharge" DOUBLE PRECISION,
    "serviceChargePercentage" DOUBLE PRECISION,
    "total" DOUBLE PRECISION,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
