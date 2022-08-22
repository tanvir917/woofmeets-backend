-- CreateEnum
CREATE TYPE "otpType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "otpGenerationType" AS ENUM ('FORGET_PASSWORD', 'PHONE_VERIFICATION');

-- CreateTable
CREATE TABLE "Country" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "currency" TEXT,
    "currencyCode" TEXT,
    "exchangeRate" DOUBLE PRECISION,
    "alpha2" TEXT,
    "alpha3" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);
