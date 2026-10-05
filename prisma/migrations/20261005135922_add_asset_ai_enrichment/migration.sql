-- AlterEnum
ALTER TYPE "AssetType" ADD VALUE 'PUBLIC_INFRASTRUCTURE';

-- AlterTable
ALTER TABLE "InfrastructureAsset" ADD COLUMN     "enrichmentSource" TEXT,
ADD COLUMN     "enrichmentSummary" TEXT,
ADD COLUMN     "enrichmentUpdatedAt" TIMESTAMP(3);
