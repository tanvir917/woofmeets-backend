-- CreateEnum
CREATE TYPE "petTypeEnum" AS ENUM ('DOG', 'CAT', 'ANY');

-- CreateTable
CREATE TABLE "ServiceType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "icon" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "petType" "petTypeEnum" NOT NULL DEFAULT 'ANY',
    "browsable" BOOLEAN NOT NULL DEFAULT true,
    "start_date_selector_description" TEXT NOT NULL,
    "end_date_selector_description" TEXT NOT NULL,
    "appRequired" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ServiceType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceType_slug_key" ON "ServiceType"("slug");
