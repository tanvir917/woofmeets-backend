-- AlterTable
ALTER TABLE "Country" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "ServiceType" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(3);
