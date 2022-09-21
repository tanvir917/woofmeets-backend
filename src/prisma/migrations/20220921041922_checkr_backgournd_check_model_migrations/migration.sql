-- CreateTable
CREATE TABLE "ProviderCheckrCandidate" (
    "id" BIGSERIAL NOT NULL,
    "providerId" BIGINT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "reportIds" JSONB,
    "geoIds" JSONB,
    "adjugation" TEXT,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProviderCheckrCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCheckrInvitation" (
    "id" BIGSERIAL NOT NULL,
    "providerCheckrCandidateId" BIGINT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "uri" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL,
    "package" TEXT NOT NULL,
    "reportId" TEXT,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProviderCheckrInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCheckrReport" (
    "id" BIGSERIAL NOT NULL,
    "providerCheckrCandidateId" BIGINT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "assessment" TEXT,
    "package" TEXT,
    "adjudication" TEXT,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ProviderCheckrReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCheckrCandidate_providerId_key" ON "ProviderCheckrCandidate"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCheckrCandidate_candidateId_key" ON "ProviderCheckrCandidate"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCheckrCandidate_email_key" ON "ProviderCheckrCandidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCheckrInvitation_invitationId_key" ON "ProviderCheckrInvitation"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCheckrReport_reportId_key" ON "ProviderCheckrReport"("reportId");

-- AddForeignKey
ALTER TABLE "ProviderCheckrCandidate" ADD CONSTRAINT "ProviderCheckrCandidate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCheckrInvitation" ADD CONSTRAINT "ProviderCheckrInvitation_providerCheckrCandidateId_fkey" FOREIGN KEY ("providerCheckrCandidateId") REFERENCES "ProviderCheckrCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCheckrReport" ADD CONSTRAINT "ProviderCheckrReport_providerCheckrCandidateId_fkey" FOREIGN KEY ("providerCheckrCandidateId") REFERENCES "ProviderCheckrCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
