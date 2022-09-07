-- AlterTable
ALTER TABLE "ProviderServices" ADD COLUMN     "fulltime" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "radius" INTEGER NOT NULL DEFAULT 10;
