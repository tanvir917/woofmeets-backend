-- AlterEnum
ALTER TYPE "otpGenerationType" ADD VALUE 'APPOINTMENT';

-- CreateTable
CREATE TABLE "Otp" (
    "id" BIGSERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "otpType" NOT NULL,
    "generationType" "otpGenerationType" NOT NULL,
    "expireAt" TIMESTAMPTZ(3) NOT NULL,
    "delivered" BOOLEAN NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpLog" (
    "id" BIGSERIAL NOT NULL,
    "recipient" TEXT NOT NULL,
    "otpId" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "OtpLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OtpLog" ADD CONSTRAINT "OtpLog_otpId_fkey" FOREIGN KEY ("otpId") REFERENCES "Otp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
