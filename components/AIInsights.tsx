"use client";

import { useState } from "react";
import {
  Brain,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Database,
  CloudRain,
  Wrench,
} from "lucide-react";

interface Report {
  headline: string;
  overview: string;
  infrastructure_priorities: string[];
  environmental_factors: string[];
  data_gaps: string[];
  recommended_actions: string[];
  predictive_readiness:
    | "READY"
    | "PARTIALLY_READY"
    | "NOT_READY";
  predictive_readiness_reason: string;
}

export default function AIInsights() {
  const [report, setReport] =
    useState<Report | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function generateInsights() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/ai/ranchi-insights",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "AI request failed"
        );
      }

      setReport(data.report);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-emerald-600" />

            <h2 className="text-lg font-semibold text-slate-900">
              AI Infrastructure Intelligence
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Groq AI analyzes Ranchi infrastructure data and
            produces engineering recommendations.
          </p>
        </div>

        <button
          onClick={generateInsights}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Analyze Ranchi
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Brain className="mx-auto h-8 w-8 text-slate-400" />

          <p className="mt-3 font-medium text-slate-700">
            AI analysis ready
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Click "Analyze Ranchi" to generate an
            infrastructure intelligence report.
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-32 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      )}

      {report && (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              AI Assessment
            </p>

            <h3 className="mt-2 text-xl font-bold text-slate-900">
              {report.headline}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {report.overview}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InsightCard
              icon={<Wrench className="h-5 w-5" />}
              title="Infrastructure Priorities"
              items={report.infrastructure_priorities}
            />

            <InsightCard
              icon={<CloudRain className="h-5 w-5" />}
              title="Environmental Factors"
              items={report.environmental_factors}
            />

            <InsightCard
              icon={<Database className="h-5 w-5" />}
              title="Data Gaps"
              items={report.data_gaps}
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Recommended Actions
            </h3>

            <div className="space-y-2">
              {report.recommended_actions.map(
                (action, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                      {index + 1}
                    </div>

                    <p className="text-sm leading-6 text-slate-600">
                      {action}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {report.predictive_readiness ===
            "READY" ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
            )}

            <div>
              <p className="text-sm font-semibold text-slate-900">
                Predictive Model Readiness:{" "}
                {report.predictive_readiness}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {report.predictive_readiness_reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function InsightCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 text-slate-900">
        {icon}

        <h3 className="font-semibold">
          {title}
        </h3>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="text-sm leading-5 text-slate-600"
          >
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}