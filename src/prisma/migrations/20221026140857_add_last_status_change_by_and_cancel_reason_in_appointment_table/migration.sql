-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "lastStatusChangedBy" "appointmentProposalEnum";
