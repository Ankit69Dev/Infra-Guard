import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  FileWarning,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export default async function RiskPage() {
  const reports = await prisma.report.findMany({
    orderBy: [
      {
        asset: {
          riskScore: "desc",
        },
      },
      {
        createdAt: "desc",
      },
    ],
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

  const criticalCount = reports.filter(
    (report) => report.asset?.riskLevel === "CRITICAL"
  ).length;

  const highCount = reports.filter(
    (report) => report.asset?.riskLevel === "HIGH"
  ).length;

  const mediumCount = reports.filter(
    (report) => report.asset?.riskLevel === "MEDIUM"
  ).length;

  const lowCount = reports.filter(
    (report) => report.asset?.riskLevel === "LOW"
  ).length;

  const pendingCount = reports.filter(
    (report) => !report.asset?.riskLevel
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] p-6 lg:p-8">

        {/* =========================================================
            HEADER
        ========================================================= */}
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">
              Ranchi, Jharkhand
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Risk Monitoring
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Lifecycle-based risk assessment for every reported
              infrastructure issue.
            </p>
          </div>

          <Link
            href="/dashboard/reports"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            View reports
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* =========================================================
            RISK SUMMARY
        ========================================================= */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <RiskSummaryCard
            label="Critical"
            value={criticalCount}
            description="Immediate attention"
            icon={ShieldAlert}
            level="CRITICAL"
          />

          <RiskSummaryCard
            label="High"
            value={highCount}
            description="Requires monitoring"
            icon={AlertTriangle}
            level="HIGH"
          />

          <RiskSummaryCard
            label="Medium"
            value={mediumCount}
            description="Needs attention"
            icon={CircleAlert}
            level="MEDIUM"
          />

          <RiskSummaryCard
            label="Low"
            value={lowCount}
            description="Lower lifecycle risk"
            icon={CheckCircle2}
            level="LOW"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Issues
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {totalReports}
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-3">
                <FileWarning
                  size={20}
                  className="text-slate-700"
                />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400">
              {pendingCount > 0
                ? `${pendingCount} pending risk calculation`
                : "All issues have risk levels"}
            </p>
          </div>
        </div>

        {/* =========================================================
            RISK EXPLANATION
        ========================================================= */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-slate-100 p-3">
              <CalendarClock
                size={20}
                className="text-slate-700"
              />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Lifecycle risk calculation
              </h2>

              <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
                Risk is calculated from infrastructure age and
                expected maintenance timing. Older assets and
                overdue maintenance receive higher risk scores.
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <RiskLegend
                  label="Critical"
                  range="75–100"
                  level="CRITICAL"
                />

                <RiskLegend
                  label="High"
                  range="50–74"
                  level="HIGH"
                />

                <RiskLegend
                  label="Medium"
                  range="25–49"
                  level="MEDIUM"
                />

                <RiskLegend
                  label="Low"
                  range="0–24"
                  level="LOW"
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            ALL ISSUES
        ========================================================= */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Issue Risk Assessment
            </h2>

            <p className="text-sm text-slate-500">
              Every reported issue ranked by its calculated risk.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {reports.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <RiskReportRow
                    key={report.id}
                    report={report}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ===============================================================
   RISK REPORT ROW
=============================================================== */

function RiskReportRow({
  report,
}: {
  report: Awaited<
    ReturnType<typeof prisma.report.findMany<{
      include: {
        asset: {
          select: {
            id: true;
            assetCode: true;
            name: true;
            type: true;
            riskScore: true;
            riskLevel: true;
            installationYear: true;
            expectedMaintenanceYear: true;
            currentYear: true;
            ageYears: true;
          };
        };
      };
    }>
  >>[number];
}) {
  const riskScore = report.asset?.riskScore ?? null;
  const riskLevel = report.asset?.riskLevel ?? null;

  const percentage =
    riskScore !== null
      ? Math.min(100, Math.max(0, Math.round(riskScore)))
      : 0;

  return (
    <Link
      href={`/dashboard/reports/${report.id}`}
      className="group block p-5 transition hover:bg-slate-50"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">

        {/* =======================================================
            ISSUE
        ======================================================= */}
        <div className="flex min-w-0 flex-1 items-start gap-4">
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

              {riskLevel && (
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${riskBadgeClass(
                    riskLevel
                  )}`}
                >
                  {riskLevel}
                </span>
              )}
            </div>

            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
              {report.description}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{report.reportCode}</span>

              <span>•</span>

              <span>{report.type}</span>

              <span>•</span>

              <span>{report.department}</span>

              <span>•</span>

              <span>
                {formatDate(report.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* =======================================================
            RISK SCORE
        ======================================================= */}
        <div className="w-full shrink-0 xl:w-[330px]">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Risk level
            </span>

            <span
              className={`text-sm font-bold ${riskTextClass(
                riskLevel
              )}`}
            >
              {riskScore !== null
                ? `${percentage}%`
                : "Pending"}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${riskBarClass(
                riskLevel
              )}`}
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              0
            </span>

            <span className="text-[11px] font-medium text-slate-500">
              {riskLevel
                ? `${riskLevel} risk`
                : "Risk not calculated"}
            </span>

            <span className="text-[11px] text-slate-400">
              100
            </span>
          </div>
        </div>

        {/* =======================================================
            LIFECYCLE
        ======================================================= */}
        <div className="w-full shrink-0 xl:w-[240px]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Lifecycle
          </p>

          {report.asset ? (
            <>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {report.asset.installationYear ??
                  "Unknown"}{" "}
                →{" "}
                {report.asset.expectedMaintenanceYear ??
                  "Unknown"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {report.asset.ageYears !== null &&
                report.asset.ageYears !== undefined
                  ? `${Math.round(
                      report.asset.ageYears
                    )} years old`
                  : "Age unavailable"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              No linked asset
            </p>
          )}
        </div>

        {/* =======================================================
            STATUS
        ======================================================= */}
        <div className="flex shrink-0 items-center justify-between gap-4 xl:w-[150px]">
          <div>
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
          </div>

          <ChevronRight
            size={18}
            className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600"
          />
        </div>
      </div>
    </Link>
  );
}

/* ===============================================================
   SUMMARY CARD
=============================================================== */

function RiskSummaryCard({
  label,
  value,
  description,
  icon: Icon,
  level,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  level: string;
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
          className={`rounded-xl p-3 ${riskBgClass(
            level
          )}`}
        >
          <Icon
            size={20}
            className={riskTextClass(level)}
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
   RISK LEGEND
=============================================================== */

function RiskLegend({
  label,
  range,
  level,
}: {
  label: string;
  range: string;
  level: string;
}) {
  return (
    <span
      className={`rounded-lg px-3 py-2 ${riskBgClass(
        level
      )} ${riskTextClass(level)}`}
    >
      {label} {range}
    </span>
  );
}

/* ===============================================================
   EMPTY STATE
=============================================================== */

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-full bg-slate-100 p-4">
        <FileWarning
          size={28}
          className="text-slate-400"
        />
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">
        No reported issues
      </h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">
        Infrastructure issues will appear here once reports
        are submitted.
      </p>
    </div>
  );
}

/* ===============================================================
   RISK STYLES
=============================================================== */

function riskBgClass(level: string | null) {
  switch (level) {
    case "CRITICAL":
      return "bg-red-100";

    case "HIGH":
      return "bg-orange-100";

    case "MEDIUM":
      return "bg-yellow-100";

    case "LOW":
      return "bg-emerald-100";

    default:
      return "bg-slate-100";
  }
}

function riskTextClass(level: string | null) {
  switch (level) {
    case "CRITICAL":
      return "text-red-700";

    case "HIGH":
      return "text-orange-700";

    case "MEDIUM":
      return "text-yellow-700";

    case "LOW":
      return "text-emerald-700";

    default:
      return "text-slate-500";
  }
}

function riskBarClass(level: string | null) {
  switch (level) {
    case "CRITICAL":
      return "bg-red-500";

    case "HIGH":
      return "bg-orange-500";

    case "MEDIUM":
      return "bg-yellow-500";

    case "LOW":
      return "bg-emerald-500";

    default:
      return "bg-slate-400";
  }
}

function riskBadgeClass(level: string | null) {
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

function formatDate(value: Date) {
  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}