-- CreateTable
CREATE TABLE "OfficialProject" (
    "id" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assetType" "AssetType" NOT NULL DEFAULT 'ROAD',
    "projectDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "agreementAmount" DOUBLE PRECISION,
    "physicalProgress" DOUBLE PRECISION,
    "financialProgress" DOUBLE PRECISION,
    "scheduledDate" TIMESTAMP(3),
    "contractor" TEXT,
    "department" TEXT,
    "source" TEXT,
    "sourceUrl" TEXT,
    "matchedAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficialProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfficialProject_assetType_idx" ON "OfficialProject"("assetType");

-- CreateIndex
CREATE INDEX "OfficialProject_projectDate_idx" ON "OfficialProject"("projectDate");

-- CreateIndex
CREATE INDEX "OfficialProject_matchedAssetId_idx" ON "OfficialProject"("matchedAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficialProject_projectCode_title_key" ON "OfficialProject"("projectCode", "title");

-- AddForeignKey
ALTER TABLE "OfficialProject" ADD CONSTRAINT "OfficialProject_matchedAssetId_fkey" FOREIGN KEY ("matchedAssetId") REFERENCES "InfrastructureAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
