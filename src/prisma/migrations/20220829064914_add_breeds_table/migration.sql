-- CreateTable
CREATE TABLE "Breeds" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "petType" "petTypeEnum" NOT NULL,
    "sequence" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Breeds_pkey" PRIMARY KEY ("id")
);
