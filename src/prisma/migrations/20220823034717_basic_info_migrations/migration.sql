-- CreateTable
CREATE TABLE "BasicInfo" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "dob" TIMESTAMPTZ(3) NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "street" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION DEFAULT 0,
    "longitude" DOUBLE PRECISION DEFAULT 0,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BasicInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BasicInfo_userId_key" ON "BasicInfo"("userId");

-- AddForeignKey
ALTER TABLE "BasicInfo" ADD CONSTRAINT "BasicInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasicInfo" ADD CONSTRAINT "BasicInfo_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
