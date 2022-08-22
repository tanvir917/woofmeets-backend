/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Provider_userId_key" ON "Provider"("userId");
