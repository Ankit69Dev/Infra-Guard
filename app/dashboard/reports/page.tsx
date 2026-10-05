import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  MapPin,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

const typeLabels = {
  ROAD: "Road",
  BRIDGE: "Bridge",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlight",
} as const;

const riskStyles = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
} as const;

const statusStyles = {
  OPEN: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-purple-50 text-purple-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
} as const;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getRiskLevel(
  riskLevel: string | null | undefined
) {
  if (
    riskLevel === "LOW" ||
    riskLevel === "MEDIUM" ||
    riskLevel === "HIGH" ||
    riskLevel === "CRITICAL"
  ) {
    return riskLevel;
  }

  return null;
}

function formatRiskScore(
  riskScore: number | null | undefined
) {
  if (
    riskScore === null ||
    riskScore === undefined ||
    !Number.isFinite(riskScore)
  ) {
    return "—";
  }

  return Math.round(riskScore);
}

export default async function ReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      asset: {
        select: {
          id: true,
          assetCode: true,
          name: true,
          type: true,
          riskScore: true,
          riskLevel: true,
          installationYear: true,
          expectedMaintenanceYear: true,
          currentYear: true,
          ageYears: true,
        },
      },
    },
  });

  const totalReports = reports.length;

  const openReports = reports.filter(
    (report) =>
      report.status === "OPEN" ||
      report.status === "UNDER_REVIEW" ||
      report.status === "IN_PROGRESS"
  ).length;

  const criticalReports = reports.filter(
    (report) =>
      report.asset?.riskLevel === "CRITICAL"
  ).length;

  const resolvedReports = reports.filter(
    (report) => report.status === "RESOLVED"
  ).length;

  return (
    <div className="min-h-full bg-slate-50">
      {/* Page Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                  <ClipboardList
                    size={22}
                    className="text-slate-700"
                  />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Reports
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Infrastructure issues reported across Ranchi.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/dashboard?report=1"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={18} />
              Report Issue
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-7">
        {/* Statistics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Reports"
            value={totalReports}
            icon={<ClipboardList size={19} />}
          />

          <StatCard
            label="Active Reports"
            value={openReports}
            icon={<AlertTriangle size={19} />}
          />

          <StatCard
            label="Critical Risk"
            value={criticalReports}
            icon={<AlertTriangle size={19} />}
          />

          <StatCard
            label="Resolved"
            value={resolvedReports}
            icon={<ClipboardList size={19} />}
          />
        </div>

        {/* Reports */}
        <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Infrastructure Reports
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Citizen and department reports submitted to Infra Guard.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {totalReports} report
              {totalReports !== 1 ? "s" : ""}
            </span>
          </div>

          {reports.length === 0 ? (
            <EmptyReports />
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((report) => {
                const riskLevel = getRiskLevel(
                  report.asset?.riskLevel
                );

                return (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="group block px-6 py-5 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      {/* Main information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {riskLevel ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${riskStyles[riskLevel]}`}
                            >
                              {riskLevel} RISK
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                              RISK PENDING
                            </span>
                          )}

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {typeLabels[report.type]}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[report.status]}`}
                          >
                            {report.status.replace(
                              "_",
                              " "
                            )}
                          </span>
                        </div>

                        <h3 className="mt-3 truncate text-sm font-bold text-slate-900 group-hover:text-slate-700">
                          {report.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
                          {report.description}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-500">
                            {report.reportCode}
                          </span>

                          <span className="flex items-center gap-1">
                            <MapPin size={13} />

                            {report.address
                              ? `${report.address}, Ranchi`
                              : `${report.latitude.toFixed(
                                  4
                                )}, ${report.longitude.toFixed(
                                  4
                                )}`}
                          </span>

                          <span>
                            {report.department}
                          </span>

                          <span>
                            {formatDate(
                              report.createdAt
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Asset / Lifecycle Risk */}
                      <div className="flex shrink-0 items-center gap-5 lg:w-80 lg:justify-end">
                        <div className="text-right">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Asset
                          </p>

                          <p className="mt-1 max-w-[180px] truncate text-xs font-semibold text-slate-700">
                            {report.asset?.name ??
                              "No asset linked"}
                          </p>

                          {report.asset?.assetCode && (
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {report.asset.assetCode}
                            </p>
                          )}
                        </div>

                        <div className="hidden text-right sm:block">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            Risk Score
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-800">
                            {formatRiskScore(
                              report.asset?.riskScore
                            )}
                            {report.asset?.riskScore != null
                              ? "/100"
                              : ""}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {report.asset?.installationYear &&
                            report.asset?.expectedMaintenanceYear
                              ? `${report.asset.installationYear} → ${report.asset.expectedMaintenanceYear}`
                              : "Lifecycle data pending"}
                          </p>
                        </div>

                        <ArrowRight
                          size={18}
                          className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function EmptyReports() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <ClipboardList
          size={25}
          className="text-slate-400"
        />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-900">
        No reports yet
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Infrastructure reports submitted by citizens will
        appear here.
      </p>

      <Link
        href="/dashboard?report=1"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus size={17} />
        Report Issue
      </Link>
    </div>
  );
}