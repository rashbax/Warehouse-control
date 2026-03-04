-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'WAREHOUSE_MANAGER', 'MARKETPLACE_MANAGER');

-- AlterTable: User — add role
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN';

-- AlterTable: SKU — drop old columns, add new ones
ALTER TABLE "SKU" DROP COLUMN IF EXISTS "honestSign";
ALTER TABLE "SKU" DROP COLUMN IF EXISTS "note";
ALTER TABLE "SKU" ADD COLUMN "marketplace" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SKU" ADD COLUMN "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: Operation — add chestnyZnak
ALTER TABLE "Operation" ADD COLUMN "chestnyZnak" TEXT;

-- CreateIndex
CREATE INDEX "Operation_chestnyZnak_idx" ON "Operation"("chestnyZnak");

-- CreateIndex (skuId + type composite — already exists, skip if present)
CREATE INDEX IF NOT EXISTS "Operation_skuId_type_idx" ON "Operation"("skuId", "type");

-- Fix: update Operation foreign key to CASCADE on delete (if not already set)
-- (onDelete: Cascade was in the schema already, so this may be a no-op)
