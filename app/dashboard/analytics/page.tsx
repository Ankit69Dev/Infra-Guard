import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileWarning,
  MapPin,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

const riskStyles = {
  CRITICAL: {
    label: "Critical",
    badge: "bg-red-100 text-red-700",
    bar: "bg-red-500",
  },
  HIGH: {
    label: "High",
    badge: "bg-orange-100 text-orange-700",
    bar: "bg-orange-500",
  },
  MEDIUM: {
    label: "Medium",
    badge: "bg-yellow-100 text-yellow-700",
    bar: "bg-yellow-500",
  },
  LOW: {
    label: "Low",
    badge: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
  },
} as const;

const statusStyles: Record<
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
  ROAD: "Roads",
  BRIDGE: "Bridges",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlights",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(date);
}

function getPercentage(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function riskColor(level: string | null) {
  if (level === "CRITICAL") return "bg-red-500";
  if (level === "HIGH") return "bg-orange-500";
  if (level === "MEDIUM") return "bg-yellow-500";
  return "bg-emerald-500";
}

export default async function AnalyticsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [
    reports,
    assets,
    riskGroups,
    typeGroups,
    statusGroups,
    departmentGroups,
    recentReports,
  ] = await Promise.all([
    prisma.report.findMany({
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
    }),

    prisma.infrastructureAsset.findMany({
      select: {
        id: true,
        type: true,
        riskScore: true,
        riskLevel: true,
        installationYear: true,
        expectedMaintenanceYear: true,
        currentYear: true,
      },
    }),

    prisma.infrastructureAsset.groupBy({
      by: ["riskLevel"],
      _count: {
        _all: true,
      },
    }),

    prisma.report.groupBy({
      by: ["type"],
      _count: {
        _all: true,
      },
    }),

    prisma.report.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.report.groupBy({
      by: ["department"],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          department: "desc",
        },
      },
    }),

    prisma.report.findMany({
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        reportCode: true,
        title: true,
        type: true,
        status: true,
        department: true,
        createdAt: true,
        asset: {
          select: {
            riskScore: true,
            riskLevel: true,
          },
        },
      },
    }),
  ]);

  const totalReports = reports.length;
  const totalAssets = assets.length;

  const riskCounts = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const group of riskGroups) {
    if (
      group.riskLevel &&
      group.riskLevel in riskCounts
    ) {
      riskCounts[
        group.riskLevel as keyof typeof riskCounts
      ] = group._count._all;
    }
  }

  const riskKnownAssets =
    riskCounts.CRITICAL +
    riskCounts.HIGH +
    riskCounts.MEDIUM +
    riskCounts.LOW;

  const riskScores = assets
    .map((asset) => asset.riskScore)
    .filter(
      (score): score is number =>
        typeof score === "number"
    );

  const averageRiskScore = riskScores.length
    ? Math.round(
        riskScores.reduce(
          (sum, score) => sum + score,
          0
        ) / riskScores.length
      )
    : 0;

  const overdueMaintenance = assets.filter(
    (asset) =>
      asset.expectedMaintenanceYear !== null &&
      asset.expectedMaintenanceYear < currentYear
  ).length;

  const maintenanceDueSoon = assets.filter(
    (asset) =>
      asset.expectedMaintenanceYear !== null &&
      asset.expectedMaintenanceYear >= currentYear &&
      asset.expectedMaintenanceYear <= currentYear + 2
  ).length;

  const unresolvedReports = reports.filter(
    (report) =>
      report.status !== "RESOLVED" &&
      report.status !== "REJECTED"
  ).length;

  const resolvedReports = reports.filter(
    (report) => report.status === "RESOLVED"
  ).length;

  const resolutionRate = totalReports
    ? Math.round(
        (resolvedReports / totalReports) * 100
      )
    : 0;

  const typeData = typeGroups
    .map((group) => ({
      type: String(group.type),
      label:
        typeLabels[String(group.type)] ??
        String(group.type),
      count: group._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const maxTypeCount = Math.max(
    ...typeData.map((item) => item.count),
    1
  );

  const statusData = statusGroups
    .map((group) => ({
      status: String(group.status),
      label:
        statusStyles[String(group.status)]?.label ??
        String(group.status),
      count: group._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const maxStatusCount = Math.max(
    ...statusData.map((item) => item.count),
    1
  );

  const departmentData = departmentGroups.map(
    (group) => ({
      department: group.department,
      count: group._count._all,
    })
  );

  const maxDepartmentCount = Math.max(
    ...departmentData.map((item) => item.count),
    1
  );

  /*
   * Build the last six months in chronological order.
   * This is calculated from the actual report.createdAt values.
   */
  const monthlyData = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date(
        currentYear,
        now.getMonth() - (5 - index),
        1
      );

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: monthLabel(date),
        count: 0,
      };
    }
  );

  for (const report of reports) {
    const reportDate = new Date(report.createdAt);

    const key = `${reportDate.getFullYear()}-${reportDate.getMonth()}`;

    const month = monthlyData.find(
      (item) => item.key === key
    );

    if (month) {
      month.count += 1;
    }
  }

  const maxMonthlyCount = Math.max(
    ...monthlyData.map((item) => item.count),
    1
  );

  const criticalPercentage = getPercentage(
    riskCounts.CRITICAL,
    riskKnownAssets
  );

  const highPercentage = getPercentage(
    riskCounts.HIGH,
    riskKnownAssets
  );

  const mediumPercentage = getPercentage(
    riskCounts.MEDIUM,
    riskKnownAssets
  );

  const lowPercentage = getPercentage(
    riskCounts.LOW,
    riskKnownAssets
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                <BarChart3 className="h-4 w-4" />
                Infrastructure Analytics
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                A real-time view of infrastructure reports,
                lifecycle risk, maintenance exposure and
                department workload.
              </p>
            </div>

            <Link
              href="/dashboard/reports"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View all reports
              <Activity className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total reports
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalReports}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <FileWarning className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {unresolvedReports} currently unresolved
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Infrastructure assets
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalAssets}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Assets currently tracked by Infra Guard
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Average risk score
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {averageRiskScore}
                  <span className="ml-1 text-base font-medium text-slate-400">
                    /100
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Based on assets with calculated lifecycle risk
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Resolution rate
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {resolutionRate}%
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {resolvedReports} of {totalReports} reports resolved
            </p>
          </div>
        </section>

        {/* Risk overview */}
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Lifecycle risk distribution
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Risk calculated from asset age and maintenance schedule.
                </p>
              </div>

              <ShieldAlert className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 space-y-5">
              {(
                [
                  ["CRITICAL", criticalPercentage],
                  ["HIGH", highPercentage],
                  ["MEDIUM", mediumPercentage],
                  ["LOW", lowPercentage],
                ] as const
              ).map(([level, percentage]) => {
                const style = riskStyles[level];

                return (
                  <div key={level}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${style.badge}`}
                        >
                          {style.label}
                        </span>

                        <span className="text-sm text-slate-500">
                          {
                            riskCounts[
                              level as keyof typeof riskCounts
                            ]
                          } assets
                        </span>
                      </div>

                      <span className="text-sm font-bold text-slate-700">
                        {percentage}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${style.bar}`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Maintenance exposure
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assets approaching or exceeding their expected maintenance year.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-red-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-100 p-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Overdue maintenance
                    </p>
                    <p className="text-xs text-slate-500">
                      Maintenance year has passed
                    </p>
                  </div>
                </div>

                <span className="text-2xl font-bold text-red-600">
                  {overdueMaintenance}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-orange-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                    <Clock3 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Due within 2 years
                    </p>
                    <p className="text-xs text-slate-500">
                      Maintenance due soon
                    </p>
                  </div>
                </div>

                <span className="text-2xl font-bold text-orange-600">
                  {maintenanceDueSoon}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Assets with known risk
                  </span>

                  <span className="font-bold text-slate-900">
                    {riskKnownAssets}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly trend */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Reporting trend
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Reports created during the last six months.
              </p>
            </div>

            <TrendingUp className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-8 flex h-56 items-end gap-3 sm:gap-6">
            {monthlyData.map((month) => {
              const height =
                month.count === 0
                  ? 4
                  : Math.max(
                      10,
                      Math.round(
                        (month.count / maxMonthlyCount) *
                          100
                      )
                    );

              return (
                <div
                  key={month.key}
                  className="flex h-full flex-1 flex-col justify-end"
                >
                  <div className="mb-2 text-center text-xs font-semibold text-slate-600">
                    {month.count}
                  </div>

                  <div className="flex h-40 items-end">
                    <div
                      className="w-full rounded-t-xl bg-blue-500 transition-all"
                      style={{
                        height: `${height}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 text-center text-xs font-medium text-slate-500">
                    {month.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Type + status */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Infrastructure types */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Reports by infrastructure type
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Which infrastructure receives the most reports.
                </p>
              </div>

              <MapPin className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 space-y-5">
              {typeData.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No report data available.
                </p>
              ) : (
                typeData.map((item) => (
                  <div key={item.type}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>

                      <span className="text-sm font-bold text-slate-900">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{
                          width: `${Math.round(
                            (item.count / maxTypeCount) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Report status
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current workflow state of reported issues.
                </p>
              </div>

              <Activity className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 space-y-5">
              {statusData.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No report data available.
                </p>
              ) : (
                statusData.map((item) => (
                  <div key={item.status}>
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          statusStyles[item.status]?.badge ??
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.label}
                      </span>

                      <span className="text-sm font-bold text-slate-900">
                        {item.count}
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-700"
                        style={{
                          width: `${Math.round(
                            (item.count /
                              maxStatusCount) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Department workload */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Department workload
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Number of reported issues assigned to each department.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {departmentData.length === 0 ? (
              <p className="text-sm text-slate-500">
                No department data available.
              </p>
            ) : (
              departmentData.map((item) => (
                <div
                  key={item.department}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-800">
                    {item.department}
                  </p>

                  <div className="mt-4 flex items-end justify-between">
                    <span className="text-3xl font-bold text-slate-900">
                      {item.count}
                    </span>

                    <span className="text-xs text-slate-400">
                      reports
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.round(
                          (item.count /
                            maxDepartmentCount) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent reporting activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Latest infrastructure issues submitted to the system.
                </p>
              </div>

              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentReports.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No reports have been submitted yet.
              </div>
            ) : (
              recentReports.map((report) => {
                const level = report.asset?.riskLevel
                  ? String(report.asset.riskLevel)
                  : null;

                return (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="block p-5 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">
                            {report.reportCode}
                          </span>

                          {level ? (
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                riskStyles[
                                  level as keyof typeof riskStyles
                                ]?.badge ??
                                "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {level} RISK
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              RISK PENDING
                            </span>
                          )}
                        </div>

                        <h3 className="mt-1 truncate text-sm font-semibold text-slate-900">
                          {report.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {typeLabels[String(report.type)] ??
                            String(report.type)}{" "}
                          · {report.department}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-4">
                        <div className="text-right">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusStyles[
                                String(report.status)
                              ]?.badge ??
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {statusStyles[
                              String(report.status)
                            ]?.label ??
                              String(report.status)}
                          </span>

                          <p className="mt-2 text-xs text-slate-400">
                            {formatDate(report.createdAt)}
                          </p>
                        </div>

                        {report.asset?.riskScore !== null &&
                        report.asset?.riskScore !== undefined ? (
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                level === "CRITICAL"
                                  ? "text-red-600"
                                  : level === "HIGH"
                                    ? "text-orange-600"
                                    : level === "MEDIUM"
                                      ? "text-yellow-600"
                                      : "text-emerald-600"
                              }`}
                            >
                              {Math.round(
                                report.asset.riskScore
                              )}
                              %
                            </p>

                            <p className="text-[10px] text-slate-400">
                              risk
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* Analytics note */}
        <section className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <h3 className="text-sm font-bold text-blue-900">
              How these analytics work
            </h3>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              Risk analytics use the deterministic lifecycle engine.
              Risk is derived from installation year, expected
              maintenance year and current year. AI does not change
              the official risk score.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}