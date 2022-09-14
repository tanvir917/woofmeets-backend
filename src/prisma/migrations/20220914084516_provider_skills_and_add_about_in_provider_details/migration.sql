-- AlterTable
ALTER TABLE "ProviderDetails" ADD COLUMN     "about" TEXT;

-- CreateTable
CREATE TABLE "ProviderSkills" (
    "id" BIGSERIAL NOT NULL,
    "providerId" BIGINT NOT NULL,
    "skillTypeId" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProviderSkills_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProviderSkills" ADD CONSTRAINT "ProviderSkills_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderSkills" ADD CONSTRAINT "ProviderSkills_skillTypeId_fkey" FOREIGN KEY ("skillTypeId") REFERENCES "ProfileSkillType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
