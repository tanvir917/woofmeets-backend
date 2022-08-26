/*
  Warnings:

  - You are about to drop the `OtpLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OtpLog" DROP CONSTRAINT "OtpLog_otpId_fkey";

-- DropTable
DROP TABLE "OtpLog";
