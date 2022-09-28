-- CreateEnum
CREATE TYPE "appointmentStatusEnum" AS ENUM ('PENDING', 'ACCEPTED', 'PROPOSAL', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "appointmentLengthTypeEnum" AS ENUM ('WALK', 'VISIT', 'NONE');

-- CreateEnum
CREATE TYPE "appointmentProposalEnum" AS ENUM ('PROVIDER', 'USER', 'NONE');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" BIGSERIAL NOT NULL,
    "opk" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "providerId" BIGINT NOT NULL,
    "providerServiceId" BIGINT NOT NULL,
    "status" "appointmentStatusEnum" NOT NULL,
    "providerTimeZone" TEXT,
    "endOfLife" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentProposal" (
    "id" BIGSERIAL NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "proposedBy" "appointmentProposalEnum" NOT NULL,
    "original" BOOLEAN NOT NULL DEFAULT false,
    "countered" BOOLEAN NOT NULL DEFAULT false,
    "appointmentserviceType" "appointmentLengthTypeEnum" NOT NULL,
    "length" DOUBLE PRECISION,
    "additionalLengthPrice" DOUBLE PRECISION,
    "petQuantity" DOUBLE PRECISION,
    "regularPrice" DOUBLE PRECISION,
    "additionalCharge" JSONB,
    "providerExtraFee" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "firstMessage" TEXT,
    "isRecivedPhotos" BOOLEAN,
    "dropOffStartTime" TEXT,
    "dropOffEndTime" TEXT,
    "pickUpStartTime" TEXT,
    "pickUpEndTime" TEXT,
    "proposalStartDate" TEXT,
    "proposalEndDate" TEXT,
    "proposalOtherDate" JSONB[],
    "isRecurring" BOOLEAN,
    "recurringStartDate" TEXT,
    "recurringSelectedDay" JSONB[],
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentPet" (
    "id" BIGSERIAL NOT NULL,
    "petId" BIGINT NOT NULL,
    "appointmentId" BIGINT NOT NULL,
    "proposalId" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AppointmentPet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_opk_key" ON "Appointment"("opk");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "ProviderServices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentProposal" ADD CONSTRAINT "AppointmentProposal_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentPet" ADD CONSTRAINT "AppointmentPet_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentPet" ADD CONSTRAINT "AppointmentPet_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentPet" ADD CONSTRAINT "AppointmentPet_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "AppointmentProposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
