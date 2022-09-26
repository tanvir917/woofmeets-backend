-- CreateTable
CREATE TABLE "ZoomInfo" (
    "id" BIGSERIAL NOT NULL,
    "providerId" BIGINT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ZoomInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZoomInfo_providerId_key" ON "ZoomInfo"("providerId");

-- AddForeignKey
ALTER TABLE "ZoomInfo" ADD CONSTRAINT "ZoomInfo_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
