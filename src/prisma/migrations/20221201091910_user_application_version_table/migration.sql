-- CreateTable
CREATE TABLE "UserApplicationVersion" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "version" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "UserApplicationVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserApplicationVersion_userId_key" ON "UserApplicationVersion"("userId");

-- AddForeignKey
ALTER TABLE "UserApplicationVersion" ADD CONSTRAINT "UserApplicationVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
