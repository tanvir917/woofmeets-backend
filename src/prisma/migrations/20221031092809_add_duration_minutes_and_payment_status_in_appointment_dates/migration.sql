-- AlterTable
ALTER TABLE "AppointmentDates" ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
ALTER COLUMN "durationInMinutes" DROP NOT NULL;
