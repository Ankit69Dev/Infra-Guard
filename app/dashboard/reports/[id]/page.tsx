import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  ClipboardList,
  FileWarning,
  MapPin,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

const typeLabels = {
  ROAD: "Road",
  BRIDGE: "Bridge",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlight",
} as const;

const statusStyles = {
  OPEN: "bg-blue-50 text-blue-700",
  UNDER_REVIEW: "bg-purple-50 text-purple-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
} as const;

const riskStyles = {
  LOW: "bg-emerald-50 text-emerald-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
} as const;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRiskScore(
  score: number | null | undefined
) {
  if (
    score === null ||
    score === undefined ||
    !Number.isFinite(score)
  ) {
    return "Not calculated";
  }

  return `${Math.round(score)}/100`;
}

function getRiskStyle(
  level: string | null | undefined
) {
  if (
    level === "LOW" ||
    level === "MEDIUM" ||
    level === "HIGH" ||
    level === "CRITICAL"
  ) {
    return riskStyles[level];
  }

  return "bg-slate-100 text-slate-600";
}

function formatYear(
  year: number | null | undefined
) {
  return year !== null &&
    year !== undefined
    ? String(year)
    : "Not available";
}

export default async function ReportDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const report =
    await prisma.report.findUnique({
      where: {
        id,
      },
      include: {
        asset: {
          include: {
            riskAnalyses: {
              orderBy: {
                analyzedAt: "desc",
              },
              take: 5,
            },
          },
        },
        riskAnalyses: {
          orderBy: {
            analyzedAt: "desc",
          },
          take: 5,
        },
      },
    });

  if (!report) {
    notFound();
  }

  /*
   * Risk is now calculated deterministically from
   * installation year, expected maintenance year,
   * and current year.
   *
   * RiskAnalysis is retained as a history of the
   * lifecycle calculations. It is not AI analysis.
   */
  const latestRisk =
    report.riskAnalyses[0] ??
    report.asset?.riskAnalyses[0] ??
    null;

  const riskScore =
    report.asset?.riskScore ??
    latestRisk?.riskScore ??
    null;

  const riskLevel =
    report.asset?.riskLevel ??
    latestRisk?.riskLevel ??
    null;

  const installationYear =
    report.asset?.installationYear ??
    report.installationYear ??
    null;

  const expectedMaintenanceYear =
    report.asset?.expectedMaintenanceYear ??
    report.expectedMaintenanceYear ??
    null;

  const currentYear =
    report.asset?.currentYear ??
    report.currentYear ??
    null;

  const ageYears =
    report.asset?.ageYears ??
    (installationYear !== null &&
    currentYear !== null
      ? Math.max(
          0,
          currentYear - installationYear
        )
      : null);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <Link
            href="/dashboard/reports"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Reports
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {riskLevel ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getRiskStyle(
                      riskLevel
                    )}`}
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

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                {report.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {report.reportCode}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 lg:min-w-56">
              <p className="text-xs font-medium text-slate-400">
                Assigned Department
              </p>

              <p className="mt-1 text-sm font-bold text-slate-800">
                {report.department}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-7">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Report information */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <FileWarning
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Report Information
                    </h2>

                    <p className="text-xs text-slate-500">
                      Details submitted with this infrastructure report.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {report.description}
                  </p>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={
                      <ClipboardList size={16} />
                    }
                    label="Infrastructure Type"
                    value={
                      typeLabels[report.type]
                    }
                  />

                  <InfoItem
                    icon={
                      <AlertTriangle size={16} />
                    }
                    label="Risk Level"
                    value={
                      riskLevel ?? "Not calculated"
                    }
                  />

                  <InfoItem
                    icon={
                      <ClipboardList size={16} />
                    }
                    label="Status"
                    value={report.status.replace(
                      "_",
                      " "
                    )}
                  />

                  <InfoItem
                    icon={
                      <CalendarDays size={16} />
                    }
                    label="Reported"
                    value={formatDate(
                      report.createdAt
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Lifecycle information */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <CalendarDays
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Infrastructure Lifecycle
                    </h2>

                    <p className="text-xs text-slate-500">
                      Risk is calculated from the asset lifecycle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <LifecycleCard
                    label="Installation Year"
                    value={formatYear(
                      installationYear
                    )}
                  />

                  <LifecycleCard
                    label="Maintenance Year"
                    value={formatYear(
                      expectedMaintenanceYear
                    )}
                  />

                  <LifecycleCard
                    label="Current Year"
                    value={formatYear(
                      currentYear
                    )}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <LifecycleCard
                    label="Asset Age"
                    value={
                      ageYears !== null
                        ? `${Math.round(
                            ageYears
                          )} years`
                        : "Not available"
                    }
                  />

                  <LifecycleCard
                    label="Risk Score"
                    value={formatRiskScore(
                      riskScore
                    )}
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <MapPin
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Issue Location
                    </h2>

                    <p className="text-xs text-slate-500">
                      Location selected from OpenStreetMap.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-medium text-slate-400">
                    Area
                  </p>

                  <p className="mt-1 text-base font-bold text-slate-900">
                    {report.address
                      ? `${report.address}, Ranchi`
                      : "Ranchi, Jharkhand"}
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Latitude
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {report.latitude}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Longitude
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {report.longitude}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-400">
                  Location data provided by OpenStreetMap.
                </p>
              </div>
            </section>

            {/* Lifecycle Risk Analysis */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <AlertTriangle
                      size={18}
                      className="text-slate-600"
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Lifecycle Risk Analysis
                    </h2>

                    <p className="text-xs text-slate-500">
                      Deterministic risk assessment based on infrastructure lifecycle dates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {riskScore !== null ||
                riskLevel !== null ||
                latestRisk ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-xs font-medium text-slate-400">
                          Risk Score
                        </p>

                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {formatRiskScore(
                            riskScore
                          )}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-xs font-medium text-slate-400">
                          Risk Level
                        </p>

                        {riskLevel ? (
                          <span
                            className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${getRiskStyle(
                              riskLevel
                            )}`}
                          >
                            {riskLevel}
                          </span>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            Not calculated
                          </p>
                        )}
                      </div>
                    </div>

                    {latestRisk?.explanation && (
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Risk Explanation
                        </p>

                        <p className="mt-2 rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
                          {latestRisk.explanation}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-100 p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Calculation Method
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          Lifecycle Rules
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-100 p-4">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                          Last Calculated
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {latestRisk
                            ? formatDate(
                                latestRisk.analyzedAt
                              )
                            : "Not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
                    <AlertTriangle
                      size={24}
                      className="mx-auto text-slate-400"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      Risk calculation not available
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Lifecycle information has not been calculated for this asset yet.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Linked Asset */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Building2
                    size={18}
                    className="text-slate-600"
                  />

                  <h2 className="text-sm font-bold text-slate-900">
                    Linked Infrastructure Asset
                  </h2>
                </div>
              </div>

              <div className="p-5">
                {report.asset ? (
                  <>
                    <p className="text-base font-bold text-slate-900">
                      {report.asset.name}
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {report.asset.assetCode}
                    </p>

                    <div className="mt-5 space-y-4">
                      <InfoItem
                        icon={
                          <Building2 size={16} />
                        }
                        label="Type"
                        value={
                          typeLabels[
                            report.asset.type
                          ]
                        }
                      />

                      <InfoItem
                        icon={
                          <ClipboardList size={16} />
                        }
                        label="Total Reports"
                        value={String(
                          report.asset
                            .totalReports
                        )}
                      />

                      <InfoItem
                        icon={
                          <AlertTriangle size={16} />
                        }
                        label="Current Risk"
                        value={
                          report.asset
                            .riskLevel ??
                          "Not calculated"
                        }
                      />

                      <InfoItem
                        icon={
                          <CalendarDays size={16} />
                        }
                        label="Installation Year"
                        value={formatYear(
                          report.asset
                            .installationYear
                        )}
                      />

                      <InfoItem
                        icon={
                          <CalendarDays size={16} />
                        }
                        label="Maintenance Year"
                        value={formatYear(
                          report.asset
                            .expectedMaintenanceYear
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <div className="py-5 text-center">
                    <Building2
                      size={24}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No asset linked
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This report has not been linked to an infrastructure asset.
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Report Metadata */}
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Report Details
                </h2>
              </div>

              <div className="space-y-4 p-5">
                <Metadata
                  label="Report ID"
                  value={report.reportCode}
                />

                <Metadata
                  label="Source"
                  value={report.source}
                />

                <Metadata
                  label="Department"
                  value={report.department}
                />

                <Metadata
                  label="Created"
                  value={formatDate(
                    report.createdAt
                  )}
                />

                <Metadata
                  label="Last Updated"
                  value={formatDate(
                    report.updatedAt
                  )}
                />
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function LifecycleCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">
          {value}
        </p>
      </div>
    </div>
  );
}

function Metadata({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}