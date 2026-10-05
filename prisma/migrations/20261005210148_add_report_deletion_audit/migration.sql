-- CreateTable
CREATE TABLE "ReportDeletion" (
    "id" TEXT NOT NULL,
    "reportCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedBy" TEXT,

    CONSTRAINT "ReportDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportDeletion_reportCode_idx" ON "ReportDeletion"("reportCode");

-- CreateIndex
CREATE INDEX "ReportDeletion_deletedAt_idx" ON "ReportDeletion"("deletedAt");
