import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  FileWarning,
  ShieldAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

const riskConfig = {
  CRITICAL: {
    label: "Critical",
    description: "Immediate attention required",
    badge: "bg-red-100 text-red-700",
    icon: "bg-red-100 text-red-600",
    border: "border-red-200",
    bar: "bg-red-500",
    text: "text-red-600",
  },
  HIGH: {
    label: "High",
    description: "Priority attention required",
    badge: "bg-orange-100 text-orange-700",
    icon: "bg-orange-100 text-orange-600",
    border: "border-orange-200",
    bar: "bg-orange-500",
    text: "text-orange-600",
  },
  MEDIUM: {
    label: "Medium",
    description: "Monitor and plan maintenance",
    badge: "bg-yellow-100 text-yellow-700",
    icon: "bg-yellow-100 text-yellow-600",
    border: "border-yellow-200",
    bar: "bg-yellow-500",
    text: "text-yellow-600",
  },
  LOW: {
    label: "Low",
    description: "Routine monitoring",
    badge: "bg-emerald-100 text-emerald-700",
    icon: "bg-emerald-100 text-emerald-600",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    text: "text-emerald-600",
  },
} as const;

const statusConfig: Record<
  string,
  {
    label: string;
    badge: string;
  }
> = {
  OPEN: {
    label: "Open",
    badge: "bg-blue-100 text-blue-700",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    badge: "bg-purple-100 text-purple-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    badge: "bg-orange-100 text-orange-700",
  },
  RESOLVED: {
    label: "Resolved",
    badge: "bg-emerald-100 text-emerald-700",
  },
  REJECTED: {
    label: "Rejected",
    badge: "bg-slate-100 text-slate-600",
  },
};

const typeLabels: Record<string, string> = {
  ROAD: "Road",
  BRIDGE: "Bridge",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlight",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function riskLevelFromScore(score: number | null) {
  if (score === null) return null;

  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";

  return "LOW";
}

export default async function AlertsPage() {
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

  const alerts = reports.map((report) => {
    const databaseRiskLevel = report.asset?.riskLevel
      ? String(report.asset.riskLevel)
      : null;

    const riskScore = report.asset?.riskScore ?? null;

    const riskLevel =
      databaseRiskLevel ??
      riskLevelFromScore(riskScore);

    return {
      ...report,
      riskScore,
      riskLevel,
    };
  });

  const criticalAlerts = alerts.filter(
    (alert) => alert.riskLevel === "CRITICAL"
  );

  const highAlerts = alerts.filter(
    (alert) => alert.riskLevel === "HIGH"
  );

  const mediumAlerts = alerts.filter(
    (alert) => alert.riskLevel === "MEDIUM"
  );

  const lowAlerts = alerts.filter(
    (alert) => alert.riskLevel === "LOW"
  );

  const unresolvedAlerts = alerts.filter(
    (alert) =>
      alert.status !== "RESOLVED" &&
      alert.status !== "REJECTED"
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
                <BellRing className="h-4 w-4" />
                Infrastructure Alerts
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Alerts
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Reported infrastructure issues ranked by their
                current lifecycle risk severity.
              </p>
            </div>

            <Link
              href="/dashboard/reports"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View reports
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Summary */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total alerts
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {alerts.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FileWarning className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">
                  Critical
                </p>

                <p className="mt-2 text-3xl font-bold text-red-700">
                  {criticalAlerts.length}
                </p>
              </div>

              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">
                  High
                </p>

                <p className="mt-2 text-3xl font-bold text-orange-700">
                  {highAlerts.length}
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">
                  Medium
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-700">
                  {mediumAlerts.length}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600">
                <AlertCircle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Unresolved
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {unresolvedAlerts.length}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Risk priority banner */}
        {criticalAlerts.length > 0 && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-red-900">
                  {criticalAlerts.length} critical issue
                  {criticalAlerts.length === 1 ? "" : "s"} require
                  attention
                </h2>

                <p className="mt-1 text-sm text-red-800">
                  These reports are linked to infrastructure assets
                  with a lifecycle risk score of 75 or above.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Alert list */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Issued reports
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Every submitted issue with its current risk severity.
                </p>
              </div>

              <BellRing className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {alerts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  No alerts
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  No infrastructure issues have been reported yet.
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const level = alert.riskLevel as
                  | keyof typeof riskConfig
                  | null;

                const config = level
                  ? riskConfig[level]
                  : null;

                const status =
                  statusConfig[String(alert.status)];

                const riskScore =
                  typeof alert.riskScore === "number"
                    ? Math.round(alert.riskScore)
                    : null;

                return (
                  <Link
                    key={alert.id}
                    href={`/dashboard/reports/${alert.id}`}
                    className="block p-5 transition hover:bg-slate-50 sm:p-6"
                  >
                    <div className="flex flex-col gap-5">
                      {/* Top row */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                              {alert.reportCode}
                            </span>

                            {config ? (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${config.badge}`}
                              >
                                {config.label.toUpperCase()} RISK
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                                RISK PENDING
                              </span>
                            )}

                            {status && (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
                              >
                                {status.label}
                              </span>
                            )}
                          </div>

                          <h3 className="mt-2 text-base font-bold text-slate-900">
                            {alert.title}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {alert.description}
                          </p>
                        </div>

                        {/* Risk score */}
                        <div className="shrink-0 text-left sm:text-right">
                          {riskScore !== null ? (
                            <>
                              <p
                                className={`text-3xl font-bold ${
                                  config?.text ??
                                  "text-slate-500"
                                }`}
                              >
                                {riskScore}%
                              </p>

                              <p className="text-xs font-medium text-slate-400">
                                lifecycle risk
                              </p>
                            </>
                          ) : (
                            <p className="text-sm font-semibold text-slate-400">
                              Pending
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Risk bar */}
                      {riskScore !== null && (
                        <div>
                          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Risk severity</span>

                            <span>
                              {riskScore}/100
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                config?.bar ??
                                "bg-slate-400"
                              }`}
                              style={{
                                width: `${Math.min(
                                  Math.max(riskScore, 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Details */}
                      <div className="grid gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="font-semibold text-slate-700">
                            Infrastructure
                          </span>

                          <p className="mt-1">
                            {typeLabels[String(alert.type)] ??
                              String(alert.type)}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Department
                          </span>

                          <p className="mt-1">
                            {alert.department}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Asset
                          </span>

                          <p className="mt-1">
                            {alert.asset?.assetCode ??
                              "New asset"}
                          </p>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">
                            Reported
                          </span>

                          <p className="mt-1">
                            {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Lifecycle */}
                      {alert.asset && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-xs">
                          <span className="font-semibold text-slate-700">
                            Lifecycle:
                          </span>

                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                            Installed{" "}
                            {alert.asset.installationYear ??
                              "Unknown"}
                          </span>

                          <span className="text-slate-300">
                            →
                          </span>

                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                            Maintenance{" "}
                            {alert.asset
                              .expectedMaintenanceYear ??
                              "Unknown"}
                          </span>

                          {alert.asset.ageYears !== null && (
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                              {Math.round(
                                alert.asset.ageYears
                              )}{" "}
                              years old
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          {config ? (
                            <>
                              <span
                                className={`h-2 w-2 rounded-full ${config.bar}`}
                              />

                              <span>
                                {config.description}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="h-2 w-2 rounded-full bg-slate-400" />

                              <span>
                                Lifecycle risk not available
                              </span>
                            </>
                          )}
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                          View report
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Risk legend */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Risk severity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Severity is determined by the official lifecycle risk score.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-bold text-red-700">
                Critical
              </p>
              <p className="mt-1 text-xs text-red-600">
                75–100 risk score
              </p>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="font-bold text-orange-700">
                High
              </p>
              <p className="mt-1 text-xs text-orange-600">
                50–74 risk score
              </p>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="font-bold text-yellow-700">
                Medium
              </p>
              <p className="mt-1 text-xs text-yellow-600">
                25–49 risk score
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-bold text-emerald-700">
                Low
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                0–24 risk score
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}