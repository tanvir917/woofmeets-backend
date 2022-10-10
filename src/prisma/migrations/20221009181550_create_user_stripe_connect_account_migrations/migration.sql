-- CreateTable
CREATE TABLE "UserStripeConnectAccount" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "defaultCurrency" TEXT,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "capabilities" JSONB,
    "requirements" JSONB,
    "futureRequirements" JSONB,
    "type" TEXT,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "UserStripeConnectAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserStripeConnectAccount_userId_key" ON "UserStripeConnectAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStripeConnectAccount_stripeAccountId_key" ON "UserStripeConnectAccount"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStripeConnectAccount_email_key" ON "UserStripeConnectAccount"("email");

-- AddForeignKey
ALTER TABLE "UserStripeConnectAccount" ADD CONSTRAINT "UserStripeConnectAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
