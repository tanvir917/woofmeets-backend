-- AlterTable
ALTER TABLE "AppointmentDates" ALTER COLUMN "visitStartTimeString" DROP NOT NULL,
ALTER COLUMN "visitStartInDateTime" DROP NOT NULL,
ALTER COLUMN "visitEndTimeString" DROP NOT NULL,
ALTER COLUMN "visitEndTimeInDateTime" DROP NOT NULL;
