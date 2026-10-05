"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type OfficialProject = {
  id: string;
  projectCode: string;
  title: string;
  assetType: "ROAD" | "BRIDGE" | "DRAINAGE" | "STREETLIGHT";
  projectDate: string | null;
  amount: number | null;
  agreementAmount: number | null;
  physicalProgress: number | null;
  financialProgress: number | null;
  scheduledDate: string | null;
  contractor: string | null;
  department: string | null;
  source: string | null;
  sourceUrl: string | null;
  matchedAssetId: string | null;
  matchedAsset: {
    id: string;
    assetCode: string;
    name: string;
    type: string;
    locationName: string | null;
  } | null;
};

type ApiResponse = {
  projects: OfficialProject[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalProjects: number;
    matchedProjects: number;
    unmatchedProjects: number;
  };
};

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatType(type: OfficialProject["assetType"]) {
  switch (type) {
    case "ROAD":
      return "Road";
    case "BRIDGE":
      return "Bridge";
    case "DRAINAGE":
      return "Drainage";
    case "STREETLIGHT":
      return "Streetlight";
    default:
      return type;
  }
}

function getTypeBadge(type: OfficialProject["assetType"]) {
  switch (type) {
    case "ROAD":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "BRIDGE":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "DRAINAGE":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "STREETLIGHT":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default function OfficialProjectsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [matched, setMatched] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 15;

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (type) {
      params.set("type", type);
    }

    if (matched) {
      params.set("matched", matched);
    }

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    return params.toString();
  }, [search, type, matched, page]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/official-projects?${query}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch official projects");
        }

        const result: ApiResponse = await response.json();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load official project records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [query]);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleTypeChange(value: string) {
    setType(value);
    setPage(1);
  }

  function handleMatchedChange(value: string) {
    setMatched(value);
    setPage(1);
  }

  const projects = data?.projects ?? [];
  const summary = data?.summary;

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
                <Building2 className="h-4 w-4" />
                Ranchi, Jharkhand
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Official Asset Project Records
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Government infrastructure project records from official
                sources.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<FileText className="h-5 w-5" />}
            label="Total Official Projects"
            value={summary?.totalProjects ?? 0}
          />

          <SummaryCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Matched to Assets"
            value={summary?.matchedProjects ?? 0}
          />

          <SummaryCard
            icon={<XCircle className="h-5 w-5" />}
            label="Awaiting Asset Match"
            value={summary?.unmatchedProjects ?? 0}
          />
        </div>

        {/* Filters */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  handleSearchChange(event.target.value)
                }
                placeholder="Search project title, reference or contractor..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            <select
              value={type}
              onChange={(event) =>
                handleTypeChange(event.target.value)
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All infrastructure types</option>
              <option value="ROAD">Road</option>
              <option value="BRIDGE">Bridge</option>
              <option value="DRAINAGE">Drainage</option>
              <option value="STREETLIGHT">Streetlight</option>
            </select>

            <select
              value={matched}
              onChange={(event) =>
                handleMatchedChange(event.target.value)
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All match statuses</option>
              <option value="true">Matched to asset</option>
              <option value="false">Not matched</option>
            </select>
          </div>
        </section>

        {/* Content */}
        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Government Project Records
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Source records are kept separate from asset-specific
                  maintenance history until a confident asset match exists.
                </p>
              </div>

              <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
                <ShieldCheck className="h-4 w-4" />
                Official source data
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : projects.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-medium text-slate-700">
                    {projects.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-slate-700">
                    {data?.pagination.total ?? 0}
                  </span>{" "}
                  projects
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(current - 1, 1))
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <span className="min-w-20 text-center text-xs text-slate-500">
                    Page {data?.pagination.page ?? page} of{" "}
                    {data?.pagination.totalPages ?? 1}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >= (data?.pagination.totalPages ?? 1)
                    }
                    onClick={() =>
                      setPage((current) => current + 1)
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProjectRow({
  project,
}: {
  project: OfficialProject;
}) {
  return (
    <article className="px-5 py-5 transition hover:bg-slate-50/70">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getTypeBadge(
                project.assetType
              )}`}
            >
              {formatType(project.assetType)}
            </span>

            {project.matchedAsset ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Matched to asset
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <XCircle className="h-3 w-3" />
                Not matched
              </span>
            )}
          </div>

          <h3 className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-900">
            {project.title}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
            <span>
              Reference:{" "}
              <span className="font-medium text-slate-700">
                {project.projectCode}
              </span>
            </span>

            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(project.projectDate)}
            </span>

            {project.contractor && (
              <span>
                Contractor:{" "}
                <span className="font-medium text-slate-700">
                  {project.contractor}
                </span>
              </span>
            )}
          </div>

          {project.matchedAsset && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2">
              <p className="text-xs text-emerald-800">
                Linked asset:{" "}
                <span className="font-medium">
                  {project.matchedAsset.name}
                </span>{" "}
                · {project.matchedAsset.assetCode}
              </p>

              {project.matchedAsset.locationName && (
                <p className="mt-0.5 text-[11px] text-emerald-700">
                  {project.matchedAsset.locationName}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-xs xl:w-72 xl:shrink-0">
          <Metric
            label="Project value"
            value={formatMoney(project.amount)}
          />

          <Metric
            label="Agreement value"
            value={formatMoney(project.agreementAmount)}
          />

          <Metric
            label="Physical progress"
            value={
              project.physicalProgress !== null
                ? `${project.physicalProgress}%`
                : "—"
            }
          />

          <Metric
            label="Financial progress"
            value={
              project.financialProgress !== null
                ? `${project.financialProgress}%`
                : "—"
            }
          />

          {project.sourceUrl && (
            <a
              href={project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="col-span-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              View official source
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-medium text-slate-700">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse px-5 py-6"
        >
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
          <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="px-5 py-16 text-center">
      <XCircle className="mx-auto h-8 w-8 text-slate-300" />
      <h3 className="mt-3 text-sm font-semibold text-slate-900">
        Unable to load projects
      </h3>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-16 text-center">
      <FileText className="mx-auto h-8 w-8 text-slate-300" />
      <h3 className="mt-3 text-sm font-semibold text-slate-900">
        No official projects found
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Try changing your search or filter.
      </p>
    </div>
  );
}