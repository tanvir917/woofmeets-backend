-- AlterTable
ALTER TABLE "Pet" ADD COLUMN     "houseTrained" "friendlyTypeEnum",
ADD COLUMN     "houseTrainedAdditionalDetails" TEXT;

-- AlterTable
ALTER TABLE "PetGallery" ADD COLUMN     "sequence" INTEGER;
