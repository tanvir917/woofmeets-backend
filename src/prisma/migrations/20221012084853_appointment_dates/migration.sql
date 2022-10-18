/*
  Warnings:

  - The `endOfLife` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AppointmentDays` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AppointmentDays" DROP CONSTRAINT "AppointmentDays_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentDays" DROP CONSTRAINT "AppointmentDays_proposalId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "lastProposalId" BIGINT,
DROP COLUMN "endOfLife",
ADD COLUMN     "endOfLife" TIMESTAMPTZ(3);

-- DropTable
DROP TABLE "AppointmentDays";

-- CreateTable
CREATE TABLE "AppointmentDates" (
    "id" BIGSERIAL NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "appointmentProposalId" BIGINT NOT NULL,
    "holidayNames" TEXT[],
    "serviceType" "appointmentLengthTypeEnum" NOT NULL,
    "visitStartTimeString" TEXT NOT NULL,
    "visitStartInDateTime" TIMESTAMPTZ(3) NOT NULL,
    "visitEndTimeString" TEXT NOT NULL,
    "visitEndTimeInDateTime" TIMESTAMPTZ(3) NOT NULL,
    "durationInMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentDates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AppointmentDates" ADD CONSTRAINT "AppointmentDates_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentDates" ADD CONSTRAINT "AppointmentDates_appointmentProposalId_fkey" FOREIGN KEY ("appointmentProposalId") REFERENCES "AppointmentProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
