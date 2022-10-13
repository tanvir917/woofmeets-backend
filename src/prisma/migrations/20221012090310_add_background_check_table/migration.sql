/*
  Warnings:

  - The values [adminRoleEnum] on the enum `adminRoleEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "adminRoleEnum_new" AS ENUM ('SUPERADMIN', 'ADMIN');
ALTER TABLE "Admin" ALTER COLUMN "role" TYPE "adminRoleEnum_new" USING ("role"::text::"adminRoleEnum_new");
ALTER TYPE "adminRoleEnum" RENAME TO "adminRoleEnum_old";
ALTER TYPE "adminRoleEnum_new" RENAME TO "adminRoleEnum";
DROP TYPE "adminRoleEnum_old";
COMMIT;

-- CreateTable
CREATE TABLE "BackgroundCheck" (
    "id" BIGSERIAL NOT NULL,
    "providerId" BIGINT NOT NULL,
    "type" "backGroundCheckEnum" NOT NULL,
    "value" INTEGER,
    "meta" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "BackgroundCheck_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BackgroundCheck" ADD CONSTRAINT "BackgroundCheck_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
