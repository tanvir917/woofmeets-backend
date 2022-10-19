-- AlterTable
ALTER TABLE "AppointmentProposal" ADD COLUMN     "appointmentEndDateTime" TIMESTAMPTZ(3),
ADD COLUMN     "appointmentStartDateTime" TIMESTAMPTZ(3);
