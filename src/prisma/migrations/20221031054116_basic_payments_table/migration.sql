-- CreateTable
CREATE TABLE "BasicPayments" (
    "id" BIGSERIAL NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BasicPayments_pkey" PRIMARY KEY ("id")
);
