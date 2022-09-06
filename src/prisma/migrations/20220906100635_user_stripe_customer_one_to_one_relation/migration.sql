/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `UserStripeCustomerAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserStripeCustomerAccount_userId_key" ON "UserStripeCustomerAccount"("userId");
