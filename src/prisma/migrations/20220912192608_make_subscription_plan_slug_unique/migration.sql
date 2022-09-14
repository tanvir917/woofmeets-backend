/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `SubscriptionPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");
