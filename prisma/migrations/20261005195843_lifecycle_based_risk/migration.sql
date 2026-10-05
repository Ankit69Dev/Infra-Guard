/*
  Warnings:

  - You are about to drop the column `aiAnalyzedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `aiExplanation` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `aiRiskLevel` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `aiRiskScore` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `frequencyScore` on the `RiskAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `locationScore` on the `RiskAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `reportScore` on the `RiskAnalysis` table. All the data in the column will be lost.
  - You are about to drop the column `severityScore` on the `RiskAnalysis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InfrastructureAsset" ADD COLUMN     "currentYear" INTEGER,
ADD COLUMN     "expectedMaintenanceYear" INTEGER,
ADD COLUMN     "installationYear" INTEGER;

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "aiAnalyzedAt",
DROP COLUMN "aiExplanation",
DROP COLUMN "aiRiskLevel",
DROP COLUMN "aiRiskScore",
DROP COLUMN "severity",
ADD COLUMN     "currentYear" INTEGER,
ADD COLUMN     "expectedMaintenanceYear" INTEGER,
ADD COLUMN     "installationYear" INTEGER;

-- AlterTable
ALTER TABLE "RiskAnalysis" DROP COLUMN "frequencyScore",
DROP COLUMN "locationScore",
DROP COLUMN "reportScore",
DROP COLUMN "severityScore";

-- DropEnum
DROP TYPE "ReportSeverity";
