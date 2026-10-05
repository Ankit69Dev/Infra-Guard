import { getServerSession } from "next-auth";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Car,
  Droplets,
  FileWarning,
  GitBranch,
  Lightbulb,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

import ReportIssueButton from "@/components/ReportIssueButton";
import DashboardMap from "@/components/DashboardMap";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [
    totalAssets,
    totalReports,
    criticalAssets,
    highAssets,
    roadAssets,
    bridgeAssets,
    drainageAssets,
    streetlightAssets,
    recentReports,
    mapReports,
  ] = await Promise.all([
    prisma.infrastructureAsset.count(),

    prisma.report.count(),

    prisma.infrastructureAsset.count({
      where: {
        riskLevel: "CRITICAL",
      },
    }),

    prisma.infrastructureAsset.count({
      where: {
        riskLevel: "HIGH",
      },
    }),

    prisma.infrastructureAsset.count({
      where: {
        type: "ROAD",
      },
    }),

    prisma.infrastructureAsset.count({
      where: {
        type: "BRIDGE",
      },
    }),

    prisma.infrastructureAsset.count({
      where: {
        type: "DRAINAGE",
      },
    }),

    prisma.infrastructureAsset.count({
      where: {
        type: "STREETLIGHT",
      },
    }),

    /*
     * Recent reports
     *
     * Risk comes from the linked infrastructure asset.
     */
    prisma.report.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      include: {
        asset: {
          select: {
            id: true,
            assetCode: true,
            name: true,
            riskScore: true,
            riskLevel: true,
          },
        },
      },
    }),

    /*
     * Reports used by the dashboard map.
     *
     * IMPORTANT:
     * Risk is stored on InfrastructureAsset, so the map
     * must load the linked asset risk values.
     */
    prisma.report.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        reportCode: true,
        title: true,
        description: true,
        type: true,
        status: true,
        department: true,
        latitude: true,
        longitude: true,
        address: true,

        asset: {
          select: {
            riskLevel: true,
            riskScore: true,
          },
        },
      },
    }),
  ]);

  /*
   * Convert Prisma results into the exact shape expected
   * by DashboardMap.
   */
  const dashboardMapReports = mapReports.map((report) => ({
    id: report.id,
    reportCode: report.reportCode,
    title: report.title,
    description: report.description,
    type: String(report.type),
    riskLevel: report.asset?.riskLevel
      ? String(report.asset.riskLevel)
      : null,
    riskScore: report.asset?.riskScore ?? null,
    status: String(report.status),
    department: report.department,
    latitude: report.latitude,
    longitude: report.longitude,
    address: report.address,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8">

        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span>Ranchi, Jharkhand</span>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Infrastructure Overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:block">
              Welcome, {session?.user?.name}
            </span>

            <ReportIssueButton />
          </div>
        </div>

        {/* =========================================================
            MAIN METRICS
        ========================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Assets"
            value={totalAssets}
            icon={Building2}
            description="Infrastructure assets"
          />

          <MetricCard
            label="Total Reports"
            value={totalReports}
            icon={FileWarning}
            description="Reported issues"
          />

          <MetricCard
            label="Critical Assets"
            value={criticalAssets}
            icon={ShieldAlert}
            description="Require urgent attention"
            danger
          />

          <MetricCard
            label="High Risk"
            value={highAssets}
            icon={AlertTriangle}
            description="Require monitoring"
          />
        </div>

        {/* =========================================================
            INFRASTRUCTURE ASSETS
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Infrastructure Assets
              </h2>

              <p className="text-sm text-slate-500">
                Current assets by infrastructure type.
              </p>
            </div>

            <Link
              href="/dashboard/assets"
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              View assets
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AssetTypeCard
              label="Roads"
              value={roadAssets}
              icon={Car}
            />

            <AssetTypeCard
              label="Bridges"
              value={bridgeAssets}
              icon={GitBranch}
            />

            <AssetTypeCard
              label="Drainage"
              value={drainageAssets}
              icon={Droplets}
            />

            <AssetTypeCard
              label="Streetlights"
              value={streetlightAssets}
              icon={Lightbulb}
            />
          </div>
        </section>

        {/* =========================================================
            REPORT MAP
        ========================================================= */}
        <section className="mt-8">
          <DashboardMap
            reports={dashboardMapReports}
          />
        </section>

        {/* =========================================================
            RECENT REPORTS
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Reports
              </h2>

              <p className="text-sm text-slate-500">
                Latest infrastructure issues submitted to the
                system.
              </p>
            </div>

            <Link
              href="/dashboard/reports"
              className="flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {recentReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="rounded-full bg-slate-100 p-4">
                  <FileWarning
                    size={28}
                    className="text-slate-400"
                  />
                </div>

                <h3 className="mt-4 font-semibold text-slate-800">
                  No reports yet
                </h3>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Public infrastructure issues will appear here
                  after they are reported.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="group flex flex-col gap-4 p-5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="mt-1 rounded-xl bg-slate-100 p-2.5">
                        <FileWarning
                          size={18}
                          className="text-slate-600"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {report.title}
                          </h3>

                          {report.asset?.riskLevel && (
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${riskBadgeClass(
                                report.asset.riskLevel
                              )}`}
                            >
                              {report.asset.riskLevel} RISK
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                          {report.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span>{report.reportCode}</span>

                          <span>•</span>

                          <span>{report.department}</span>

                          <span>•</span>

                          <span>
                            {formatDate(report.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(
                            report.status
                          )}`}
                        >
                          {report.status.replace(
                            "_",
                            " "
                          )}
                        </span>

                        {report.asset && (
                          <p
                            className={`mt-2 text-xs font-semibold ${riskClass(
                              report.asset.riskLevel
                            )}`}
                          >
                            {report.asset.riskLevel
                              ? `${report.asset.riskLevel} RISK`
                              : "RISK PENDING"}
                          </p>
                        )}
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* =========================================================
            DATABASE STATUS
        ========================================================= */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Infrastructure monitoring
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Dashboard values are loaded directly from the
                Infra Guard database.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Database connected
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   METRIC CARD
=============================================================== */

function MetricCard({
  label,
  value,
  icon: Icon,
  description,
  danger,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  description: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>

        <div
          className={`rounded-xl p-3 ${
            danger
              ? "bg-red-50"
              : "bg-slate-100"
          }`}
        >
          <Icon
            size={20}
            className={
              danger
                ? "text-red-600"
                : "text-slate-700"
            }
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

/* ===============================================================
   ASSET TYPE CARD
=============================================================== */

function AssetTypeCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="w-fit rounded-xl bg-slate-100 p-3">
        <Icon
          size={20}
          className="text-slate-700"
        />
      </div>

      <p className="mt-5 text-3xl font-bold text-slate-900">
        {value.toLocaleString()}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {label}
      </p>
    </div>
  );
}

/* ===============================================================
   HELPERS
=============================================================== */

function formatDate(value: Date) {
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function riskBadgeClass(
  level: string | null
) {
  switch (level) {
    case "CRITICAL":
      return "bg-red-100 text-red-700";

    case "HIGH":
      return "bg-orange-100 text-orange-700";

    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";

    case "LOW":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function riskClass(level: string | null) {
  switch (level) {
    case "CRITICAL":
      return "text-red-600";

    case "HIGH":
      return "text-orange-600";

    case "MEDIUM":
      return "text-yellow-600";

    case "LOW":
      return "text-emerald-600";

    default:
      return "text-slate-400";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";

    case "UNDER_REVIEW":
      return "bg-purple-100 text-purple-700";

    case "REJECTED":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-orange-100 text-orange-700";
  }
}