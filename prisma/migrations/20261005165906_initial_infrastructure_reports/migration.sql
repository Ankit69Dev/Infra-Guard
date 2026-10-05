-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ROAD', 'BRIDGE', 'DRAINAGE', 'STREETLIGHT');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReportSource" AS ENUM ('CITIZEN', 'DEPARTMENT', 'INSPECTION', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureAsset" (
    "id" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "description" TEXT,
    "locationName" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" TEXT,
    "installationDate" TIMESTAMP(3),
    "ageYears" DOUBLE PRECISION,
    "conditionScore" DOUBLE PRECISION,
    "riskScore" DOUBLE PRECISION,
    "riskLevel" "RiskLevel",
    "totalReports" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfrastructureAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reportCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "severity" "ReportSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "source" "ReportSource" NOT NULL DEFAULT 'CITIZEN',
    "department" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "imageUrl" TEXT,
    "assetId" TEXT,
    "userId" TEXT,
    "aiRiskScore" DOUBLE PRECISION,
    "aiRiskLevel" "RiskLevel",
    "aiExplanation" TEXT,
    "aiAnalyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAnalysis" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "reportId" TEXT,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "severityScore" DOUBLE PRECISION,
    "reportScore" DOUBLE PRECISION,
    "frequencyScore" DOUBLE PRECISION,
    "locationScore" DOUBLE PRECISION,
    "explanation" TEXT,
    "model" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "InfrastructureAsset_assetCode_key" ON "InfrastructureAsset"("assetCode");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_type_idx" ON "InfrastructureAsset"("type");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_latitude_longitude_idx" ON "InfrastructureAsset"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_riskScore_idx" ON "InfrastructureAsset"("riskScore");

-- CreateIndex
CREATE INDEX "InfrastructureAsset_riskLevel_idx" ON "InfrastructureAsset"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reportCode_key" ON "Report"("reportCode");

-- CreateIndex
CREATE INDEX "Report_assetId_idx" ON "Report"("assetId");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE INDEX "Report_department_idx" ON "Report"("department");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "RiskAnalysis_assetId_idx" ON "RiskAnalysis"("assetId");

-- CreateIndex
CREATE INDEX "RiskAnalysis_reportId_idx" ON "RiskAnalysis"("reportId");

-- CreateIndex
CREATE INDEX "RiskAnalysis_riskScore_idx" ON "RiskAnalysis"("riskScore");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InfrastructureAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAnalysis" ADD CONSTRAINT "RiskAnalysis_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "InfrastructureAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAnalysis" ADD CONSTRAINT "RiskAnalysis_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
