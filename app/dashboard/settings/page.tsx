"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Info,
  Lock,
  LogOut,
  Mail,
  Map,
  Shield,
  SlidersHorizontal,
  Trash2,
  User,
} from "lucide-react";

type Report = {
  id: string;
  reportCode: string;
  title: string;
  type: string;
  status: string;
  department: string;
  createdAt: string;
  asset: {
    assetCode: string;
    riskScore: number | null;
    riskLevel: string | null;
  } | null;
};

type ToggleProps = {
  enabled: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      aria-pressed={enabled}
      className={`relative h-6 w-11 rounded-full transition ${
        enabled ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          enabled ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

const riskStyles: Record<
  string,
  {
    label: string;
    badge: string;
  }
> = {
  CRITICAL: {
    label: "Critical",
    badge: "bg-red-100 text-red-700",
  },
  HIGH: {
    label: "High",
    badge: "bg-orange-100 text-orange-700",
  },
  MEDIUM: {
    label: "Medium",
    badge: "bg-yellow-100 text-yellow-700",
  },
  LOW: {
    label: "Low",
    badge: "bg-emerald-100 text-emerald-700",
  },
};

const typeLabels: Record<string, string> = {
  ROAD: "Road",
  BRIDGE: "Bridge",
  DRAINAGE: "Drainage",
  STREETLIGHT: "Streetlight",
};

const statusLabels: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under Review",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
};

export default function SettingsPage() {
  const { data: session } = useSession();

  const [saved, setSaved] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] =
    useState(true);

  const [selectedReportId, setSelectedReportId] =
    useState("");

  const [deleteReason, setDeleteReason] =
    useState("");

  const [deleteError, setDeleteError] =
    useState("");

  const [deleteSuccess, setDeleteSuccess] =
    useState("");

  const [deleting, setDeleting] = useState(false);

  const [confirmDelete, setConfirmDelete] =
    useState(false);

  const [deletionDate] = useState(
    () => new Date()
  );

  useEffect(() => {
    async function loadReports() {
      try {
        setLoadingReports(true);
        setDeleteError("");

        const response = await fetch(
          "/api/reports?limit=200",
          {
            cache: "no-store",
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load reports."
          );
        }

        const loadedReports =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.reports)
              ? data.reports
              : [];

        setReports(loadedReports);
      } catch (error) {
        console.error(
          "Failed to load reports:",
          error
        );

        setDeleteError(
          error instanceof Error
            ? error.message
            : "Unable to load reports for deletion."
        );
      } finally {
        setLoadingReports(false);
      }
    }

    loadReports();
  }, []);

  const selectedReport =
    reports.find(
      (report) =>
        report.id === selectedReportId
    ) ?? null;

  function saveSettings() {
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function requestDelete() {
    setDeleteError("");
    setDeleteSuccess("");

    if (!selectedReport) {
      setDeleteError(
        "Please select a report to delete."
      );
      return;
    }

    if (!deleteReason.trim()) {
      setDeleteError(
        "Please enter a reason for deleting the report."
      );
      return;
    }

    if (deleteReason.trim().length < 3) {
      setDeleteError(
        "Please provide a meaningful deletion reason."
      );
      return;
    }

    setConfirmDelete(true);
  }

  async function permanentlyDeleteReport() {
    if (!selectedReport) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      const response = await fetch(
        `/api/reports/${selectedReport.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: deleteReason.trim(),
            deletionDate:
              deletionDate.toISOString(),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete the report."
        );
      }

      const deletedReportCode =
        selectedReport.reportCode;

      setReports((current) =>
        current.filter(
          (report) =>
            report.id !== selectedReport.id
        )
      );

      setSelectedReportId("");
      setDeleteReason("");
      setConfirmDelete(false);

      setDeleteSuccess(
        `${deletedReportCode} was permanently deleted.`
      );

      window.setTimeout(() => {
        setDeleteSuccess("");
      }, 4000);
    } catch (error) {
      console.error(
        "Failed to delete report:",
        error
      );

      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete the report."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <SlidersHorizontal className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Settings
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage your Infra Guard account and
                dashboard preferences.
              </p>
            </div>
          </div>
        </section>

        {/* Profile */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <User className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Profile
                </h2>

                <p className="text-sm text-slate-500">
                  Your account information
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Name
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <User className="h-4 w-4 text-slate-400" />

                <span className="text-sm text-slate-700">
                  {session?.user?.name ??
                    "Not available"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Email
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Mail className="h-4 w-4 text-slate-400" />

                <span className="text-sm text-slate-700">
                  {session?.user?.email ??
                    "Account email"}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Account role
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Shield className="h-4 w-4 text-slate-400" />

                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                  USER
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Account security
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Lock className="h-4 w-4 text-emerald-500" />

                <span className="text-sm text-slate-700">
                  Authentication protected
                </span>

                <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Report Management */}
        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50/50 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-3 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Report Management
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Permanently remove an issued infrastructure
                  report from the database.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {/* Warning */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Permanent deletion
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Deleting a report permanently removes it
                  from the database. This cannot be undone.
                  The deletion reason and date are retained
                  in the deletion audit history.
                </p>
              </div>
            </div>

            {/* Select report */}
            <div>
              <label
                htmlFor="report-select"
                className="text-sm font-semibold text-slate-800"
              >
                Select report
              </label>

              <div className="relative mt-2">
                <select
                  id="report-select"
                  value={selectedReportId}
                  onChange={(event) => {
                    setSelectedReportId(
                      event.target.value
                    );
                    setDeleteError("");
                    setDeleteSuccess("");
                  }}
                  disabled={
                    loadingReports || deleting
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingReports
                      ? "Loading reports..."
                      : reports.length === 0
                        ? "No reports available"
                        : "Select a report to delete"}
                  </option>

                  {reports.map((report) => (
                    <option
                      key={report.id}
                      value={report.id}
                    >
                      {report.reportCode} —{" "}
                      {report.title}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Selected report */}
            {selectedReport && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Selected report
                    </p>

                    <h3 className="mt-1 font-bold text-slate-900">
                      {selectedReport.title}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {selectedReport.reportCode}
                    </p>
                  </div>

                  {selectedReport.asset
                    ?.riskLevel && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        riskStyles[
                          selectedReport.asset
                            .riskLevel
                        ]?.badge ??
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {riskStyles[
                        selectedReport.asset
                          .riskLevel
                      ]?.label ??
                        selectedReport.asset
                          .riskLevel}{" "}
                      Risk
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                  <div>
                    <p className="font-semibold text-slate-400">
                      Type
                    </p>

                    <p className="mt-1 text-slate-700">
                      {typeLabels[
                        selectedReport.type
                      ] ??
                        selectedReport.type}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-400">
                      Department
                    </p>

                    <p className="mt-1 text-slate-700">
                      {selectedReport.department}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-400">
                      Status
                    </p>

                    <p className="mt-1 text-slate-700">
                      {statusLabels[
                        selectedReport.status
                      ] ??
                        selectedReport.status}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label
                htmlFor="delete-reason"
                className="text-sm font-semibold text-slate-800"
              >
                Reason for deletion
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(event) => {
                  setDeleteReason(
                    event.target.value
                  );
                  setDeleteError("");
                }}
                disabled={deleting}
                rows={4}
                placeholder="Explain why this report should be permanently deleted..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-slate-50"
              />

              <p className="mt-1 text-xs text-slate-400">
                This reason will be stored in the deletion
                audit history.
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="text-sm font-semibold text-slate-800">
                Deletion date
              </label>

              <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <CalendarDays className="h-4 w-4 text-slate-400" />

                <span className="text-sm font-medium text-slate-700">
                  {new Intl.DateTimeFormat(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  ).format(deletionDate)}
                </span>

                <span className="ml-auto rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">
                  Automatic
                </span>
              </div>
            </div>

            {/* Error */}
            {deleteError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Success */}
            {deleteSuccess && (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{deleteSuccess}</span>
              </div>
            )}

            {/* Delete */}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={requestDelete}
                disabled={
                  deleting ||
                  loadingReports ||
                  !selectedReport
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete report
              </button>
            </div>
          </div>
        </section>

        {/* Confirmation modal */}
        {confirmDelete && selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-red-100 p-3 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Permanently delete report?
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Report
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {selectedReport.reportCode}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {selectedReport.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Deletion reason
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {deleteReason}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Deletion date
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {new Intl.DateTimeFormat(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }
                    ).format(deletionDate)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() =>
                    setConfirmDelete(false)
                  }
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={
                    permanentlyDeleteReport
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Permanently delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Risk system */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <Shield className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Risk system
                </h2>

                <p className="text-sm text-slate-500">
                  How Infra Guard determines infrastructure
                  risk.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="mx-6 mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

            <p className="text-xs leading-5 text-blue-800">
              Risk is calculated deterministically from
              installation year, expected maintenance year
              and current year. AI recommendations do not
              modify the official risk score.
            </p>
          </div>
        </section>

        {/* Application */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                <Info className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Application
                </h2>

                <p className="text-sm text-slate-500">
                  Infra Guard system information.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Application
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                Infra Guard
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Environment
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                Production
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Risk Engine
              </p>

              <p className="mt-2 font-semibold text-slate-800">
                Lifecycle Rules
              </p>
            </div>
          </div>
        </section>

        {/* Sign out */}
        <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Sign out
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                End your current Infra Guard session.
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </section>

        <div className="pb-6 text-center text-xs text-slate-400">
          Infra Guard · Infrastructure monitoring and
          predictive maintenance
        </div>
      </div>
    </main>
  );
}