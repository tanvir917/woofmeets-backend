/*
  Warnings:

  - A unique constraint covering the columns `[opk]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_opk_key" ON "User"("opk");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
