-- CreateTable
CREATE TABLE "HomeAttributes" (
    "id" BIGSERIAL NOT NULL,
    "providerId" BIGINT NOT NULL,
    "homeAttributeTypeId" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "HomeAttributes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HomeAttributes" ADD CONSTRAINT "HomeAttributes_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeAttributes" ADD CONSTRAINT "HomeAttributes_homeAttributeTypeId_fkey" FOREIGN KEY ("homeAttributeTypeId") REFERENCES "HomeAttributeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
