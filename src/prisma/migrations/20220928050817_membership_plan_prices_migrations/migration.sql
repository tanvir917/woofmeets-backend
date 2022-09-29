/*
  Warnings:

  - You are about to drop the column `subscriptionPlanId` on the `UserSubscriptions` table. All the data in the column will be lost.
  - Added the required column `membershipPlanPriceId` to the `UserSubscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserSubscriptions" DROP CONSTRAINT "UserSubscriptions_subscriptionPlanId_fkey";

-- AlterTable
ALTER TABLE "UserSubscriptions" DROP COLUMN "subscriptionPlanId",
ADD COLUMN     "membershipPlanPriceId" BIGINT NOT NULL;

-- CreateTable
CREATE TABLE "MembershipPlan" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stripeProductId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "details" TEXT,
    "features" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPlanPrices" (
    "id" BIGSERIAL NOT NULL,
    "membershipPlanId" BIGINT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "cropRate" DOUBLE PRECISION,
    "validity" INTEGER NOT NULL DEFAULT 1,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MembershipPlanPrices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_slug_key" ON "MembershipPlan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlan_stripeProductId_key" ON "MembershipPlan"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPlanPrices_stripePriceId_key" ON "MembershipPlanPrices"("stripePriceId");

-- AddForeignKey
ALTER TABLE "MembershipPlanPrices" ADD CONSTRAINT "MembershipPlanPrices_membershipPlanId_fkey" FOREIGN KEY ("membershipPlanId") REFERENCES "MembershipPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscriptions" ADD CONSTRAINT "UserSubscriptions_membershipPlanPriceId_fkey" FOREIGN KEY ("membershipPlanPriceId") REFERENCES "MembershipPlanPrices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
