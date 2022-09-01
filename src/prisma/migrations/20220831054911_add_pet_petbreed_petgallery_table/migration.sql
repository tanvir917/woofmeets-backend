-- CreateEnum
CREATE TYPE "genderTypeEnum" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "weightTypeEnum" AS ENUM ('KG', 'LBS');

-- CreateEnum
CREATE TYPE "friendlyTypeEnum" AS ENUM ('YES', 'NO', 'UNSURE', 'DEPENDS');

-- CreateEnum
CREATE TYPE "energyLevelTypeEnum" AS ENUM ('HIGH', 'MODERATE', 'LOW');

-- CreateTable
CREATE TABLE "Pet" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "opk" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "petTypeEnum" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "weightUnit" "weightTypeEnum" NOT NULL DEFAULT 'LBS',
    "ageYear" INTEGER NOT NULL,
    "ageMonth" INTEGER NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" "genderTypeEnum" NOT NULL,
    "profile_image" JSONB,
    "microchipped" BOOLEAN,
    "spayedOrNeutered" BOOLEAN,
    "childFriendly" "friendlyTypeEnum",
    "childFrinedlyAdditionalDetails" TEXT,
    "dogFriendly" "friendlyTypeEnum",
    "dogFrinedlyAdditionalDetails" TEXT,
    "catFriendly" "friendlyTypeEnum",
    "catFrinedlyAdditionalDetails" TEXT,
    "about" TEXT,
    "energyLevel" "energyLevelTypeEnum",
    "feedingSchedule" TEXT,
    "feedingScheduleDetails" TEXT,
    "pottyBreakSchedule" TEXT,
    "pottyBreakScheduleDetails" TEXT,
    "canLeftAlone" TEXT,
    "canLeftAloneDetails" TEXT,
    "pillMedication" TEXT,
    "topicalMedication" TEXT,
    "injectionMedication" TEXT,
    "sitterInstructions" TEXT,
    "vetInfo" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetBreed" (
    "id" BIGSERIAL NOT NULL,
    "petId" BIGINT NOT NULL,
    "breedId" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PetBreed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetGallery" (
    "id" BIGSERIAL NOT NULL,
    "petId" BIGINT NOT NULL,
    "imageSrc" JSONB NOT NULL,
    "caption" TEXT,
    "responsive" JSONB,
    "profileImage" BOOLEAN NOT NULL DEFAULT false,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PetGallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pet_opk_key" ON "Pet"("opk");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetBreed" ADD CONSTRAINT "PetBreed_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetBreed" ADD CONSTRAINT "PetBreed_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "Breeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetGallery" ADD CONSTRAINT "PetGallery_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
