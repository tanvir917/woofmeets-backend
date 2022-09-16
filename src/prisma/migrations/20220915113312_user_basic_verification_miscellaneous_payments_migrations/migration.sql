-- CreateEnum
CREATE TYPE "miscellaneousPaymentsTypeEnum" AS ENUM ('DEFAULT_VERIFICATION', 'OTHERS');

-- CreateTable
CREATE TABLE "UserBasicVerification" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "dob" DATE NOT NULL,
    "idNumber" TEXT,
    "dlOrIdImage" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "UserBasicVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiscellaneousPayments" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "piId" TEXT NOT NULL,
    "chargeId" TEXT,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "billingDate" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL,
    "type" "miscellaneousPaymentsTypeEnum" NOT NULL,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MiscellaneousPayments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBasicVerification_userId_key" ON "UserBasicVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MiscellaneousPayments_piId_key" ON "MiscellaneousPayments"("piId");

-- AddForeignKey
ALTER TABLE "UserBasicVerification" ADD CONSTRAINT "UserBasicVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiscellaneousPayments" ADD CONSTRAINT "MiscellaneousPayments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
