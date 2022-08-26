-- CreateTable
CREATE TABLE "Gallery" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "caption" TEXT,
    "imageSrc" JSONB NOT NULL,
    "sequence" INTEGER NOT NULL,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Gallery_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Gallery" ADD CONSTRAINT "Gallery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
