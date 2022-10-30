-- CreateTable
CREATE TABLE "AppointmentBillingPayments" (
    "id" BIGSERIAL NOT NULL,
    "billingId" BIGINT NOT NULL,
    "paidByUserId" BIGINT NOT NULL,
    "piId" TEXT,
    "chargeId" TEXT,
    "amount" DOUBLE PRECISION,
    "status" TEXT,
    "billingDate" TIMESTAMPTZ(3),
    "payerEmail" TEXT,
    "currency" TEXT,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentBillingPayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentBillingTransactions" (
    "id" BIGSERIAL NOT NULL,
    "billingId" BIGINT NOT NULL,
    "providerId" BIGINT NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'usd',
    "providerSubsStatus" TEXT,
    "providerPercentage" DOUBLE PRECISION,
    "providerAmount" DOUBLE PRECISION,
    "releaseDate" TIMESTAMPTZ(3),
    "releaseStatus" BOOLEAN NOT NULL DEFAULT false,
    "precessingId" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentBillingTransactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppointmentBillingPayments" ADD CONSTRAINT "AppointmentBillingPayments_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBillingPayments" ADD CONSTRAINT "AppointmentBillingPayments_paidByUserId_fkey" FOREIGN KEY ("paidByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBillingTransactions" ADD CONSTRAINT "AppointmentBillingTransactions_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBillingTransactions" ADD CONSTRAINT "AppointmentBillingTransactions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
