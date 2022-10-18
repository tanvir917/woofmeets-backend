/*
  Warnings:

  - Added the required column `timeZone` to the `Holidays` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Holidays" ADD COLUMN     "timeZone" TEXT NOT NULL;
