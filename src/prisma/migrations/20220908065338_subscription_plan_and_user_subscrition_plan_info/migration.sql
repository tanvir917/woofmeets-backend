-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "cropRate" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION,
    "details" TEXT,
    "features" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscriptionPlanInfo" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "subscriptionPlanId" BIGINT NOT NULL,
    "cardId" BIGINT,
    "stripeSubscriptionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT,
    "currentPeriodStart" TIMESTAMPTZ(3),
    "currentPeriodEnd" TIMESTAMPTZ(3),
    "status" TEXT,
    "src" JSONB,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "UserSubscriptionPlanInfo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserSubscriptionPlanInfo" ADD CONSTRAINT "UserSubscriptionPlanInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptionPlanInfo" ADD CONSTRAINT "UserSubscriptionPlanInfo_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptionPlanInfo" ADD CONSTRAINT "UserSubscriptionPlanInfo_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "UserStripeCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
