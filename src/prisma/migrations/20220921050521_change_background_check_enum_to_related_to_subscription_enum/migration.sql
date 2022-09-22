/*
  Warnings:

  - The values [ENHANCE] on the enum `backGroundCheckEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "backGroundCheckEnum_new" AS ENUM ('NONE', 'BASIC', 'GOLD', 'PLATINUM');
ALTER TABLE "Provider" ALTER COLUMN "backGroundCheck" DROP DEFAULT;
ALTER TABLE "Provider" ALTER COLUMN "backGroundCheck" TYPE "backGroundCheckEnum_new" USING ("backGroundCheck"::text::"backGroundCheckEnum_new");
ALTER TYPE "backGroundCheckEnum" RENAME TO "backGroundCheckEnum_old";
ALTER TYPE "backGroundCheckEnum_new" RENAME TO "backGroundCheckEnum";
DROP TYPE "backGroundCheckEnum_old";
ALTER TABLE "Provider" ALTER COLUMN "backGroundCheck" SET DEFAULT 'NONE';
COMMIT;
