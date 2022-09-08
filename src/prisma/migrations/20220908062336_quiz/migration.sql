-- CreateTable
CREATE TABLE "Quiz" (
    "id" BIGSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "option" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);
