/*
  Warnings:

  - A unique constraint covering the columns `[startDate,endDate]` on the table `Holidays` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Holidays_startDate_endDate_key" ON "Holidays"("startDate", "endDate");
