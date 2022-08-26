-- CreateEnum
CREATE TYPE "optionTypeEnum" AS ENUM ('CHECKBOX', 'RADIO', 'TEXT');

-- CreateTable
CREATE TABLE "HomeAttributeTitle" (
    "id" BIGSERIAL NOT NULL,
    "displayName" TEXT NOT NULL,
    "optionType" "optionTypeEnum" NOT NULL DEFAULT 'CHECKBOX',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "HomeAttributeTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeAttributeType" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "homeAttributeTitleId" BIGINT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "HomeAttributeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSkillType" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProfileSkillType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServivePetType" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "weightMin" DOUBLE PRECISION,
    "weightMax" DOUBLE PRECISION,
    "sequence" INTEGER,
    "active" BOOLEAN NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ServivePetType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeAttributeType_slug_key" ON "HomeAttributeType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSkillType_slug_key" ON "ProfileSkillType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServivePetType_slug_key" ON "ServivePetType"("slug");

-- AddForeignKey
ALTER TABLE "HomeAttributeType" ADD CONSTRAINT "HomeAttributeType_homeAttributeTitleId_fkey" FOREIGN KEY ("homeAttributeTitleId") REFERENCES "HomeAttributeTitle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
