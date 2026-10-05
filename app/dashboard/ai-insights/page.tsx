"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  Bot,
  Send,
  Search,
  ShieldAlert,
  Loader2,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ReportSummary = {
  id: string;
  reportCode: string;
  title: string;
  riskScore: number | null;
  riskLevel: string | null;
};

const riskStyles: Record<
  string,
  string
> = {
  CRITICAL:
    "border-red-200 bg-red-50 text-red-700",

  HIGH:
    "border-orange-200 bg-orange-50 text-orange-700",

  MEDIUM:
    "border-yellow-200 bg-yellow-50 text-yellow-700",

  LOW:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const suggestedQuestions = [
  "Why is this issue high risk?",
  "Why was this asset classified this way?",
  "Summarize this report.",
  "Is maintenance overdue?",
  "How old is this infrastructure?",
  "What should the department inspect first?",
];

export default function AIInsightsPage() {
  const [reportId, setReportId] =
    useState("");

  const [activeReport, setActiveReport] =
    useState<ReportSummary | null>(
      null
    );

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadReport(
    suppliedReportCode?: string
  ) {
    const value = (
      suppliedReportCode ??
      reportId
    ).trim();

    if (!value) {
      setError(
        "Enter a report code."
      );

      return;
    }

    setLoadingReport(true);

    setError("");

    setActiveReport(null);

    setMessages([]);

    try {
      const response =
        await fetch(
          `/api/ai-insights?reportCode=${encodeURIComponent(
            value
          )}`
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Report not found."
        );
      }

      const report =
        data.report;

      setActiveReport({
        id:
          report.id,

        reportCode:
          report.reportCode,

        title:
          report.title,

        riskScore:
          report.asset
            ?.riskScore ??
          null,

        riskLevel:
          report.asset
            ?.riskLevel
            ? String(
                report.asset
                  .riskLevel
              )
            : null,
      });

      setMessages([
        {
          role: "assistant",

          content:
            `Report ${report.reportCode} is loaded. Ask me anything about this infrastructure issue, its lifecycle, risk, maintenance history, or recommended next steps.`,
        },
      ]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not load the report."
      );
    } finally {
      setLoadingReport(false);
    }
  }

  async function askAI(
    event?: FormEvent,
    presetQuestion?: string
  ) {
    event?.preventDefault();

    const question =
      presetQuestion ??
      message.trim();

    if (!question) {
      return;
    }

    if (!activeReport) {
      setError(
        "Load a report before asking questions."
      );

      return;
    }

    setError("");

    setMessage("");

    setMessages(
      (current) => [
        ...current,

        {
          role: "user",
          content: question,
        },
      ]
    );

    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/ai-insights",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              reportCode:
                activeReport.reportCode,

              message:
                question,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI request failed."
        );
      }

      setMessages(
        (current) => [
          ...current,

          {
            role: "assistant",
            content:
              data.answer,
          },
        ]
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not contact AI.";

      setError(errorMessage);

      setMessages(
        (current) => [
          ...current,

          {
            role: "assistant",

            content:
              "I couldn't process that question. Please try again.",
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  const riskLevel =
    activeReport?.riskLevel
      ? String(
          activeReport.riskLevel
        )
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}

        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />

            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <Bot size={28} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                AI Insights
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Ask questions about infrastructure issues using Groq AI.
              </p>
            </div>
          </div>
        </div>

        {/* REPORT SEARCH */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Search
              size={18}
              className="text-slate-500"
            />

            <h2 className="font-semibold text-slate-900">
              Select Report
            </h2>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={reportId}
              onChange={(event) =>
                setReportId(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  loadReport();
                }
              }}
              placeholder="Example: RPT-MUVMBU5U-BZMWB"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />

            <button
              type="button"
              onClick={() =>
                loadReport()
              }
              disabled={
                loadingReport
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingReport ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Search size={17} />
              )}

              Load Report
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {/* MAIN */}

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">

          {/* SIDEBAR */}

          <aside className="space-y-6">

            {/* REPORT CONTEXT */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <ShieldAlert
                  size={18}
                  className="text-slate-600"
                />

                <h2 className="font-semibold text-slate-900">
                  Report Context
                </h2>
              </div>

              {!activeReport ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-3 w-fit rounded-xl bg-slate-100 p-3">
                    <Search
                      size={22}
                      className="text-slate-400"
                    />
                  </div>

                  <p className="text-sm leading-6 text-slate-400">
                    Enter a Report Code above to load its infrastructure data.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Report
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {
                        activeReport.reportCode
                      }
                    </p>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {
                        activeReport.title
                      }
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Lifecycle Risk
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-3xl font-bold text-slate-900">
                        {
                          activeReport.riskScore ??
                          "—"
                        }

                        {activeReport.riskScore !==
                          null &&
                          "%"}
                      </span>

                      {riskLevel ? (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            riskStyles[
                              riskLevel
                            ] ??
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {riskLevel}
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                    <strong className="text-slate-700">
                      Risk source:
                    </strong>{" "}
                    deterministic lifecycle rules.
                    AI explains the available data
                    and provides recommendations.
                  </div>
                </div>
              )}
            </section>

            {/* QUESTIONS */}

            {activeReport && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-semibold text-slate-900">
                  Suggested Questions
                </h2>

                <div className="space-y-2">
                  {suggestedQuestions.map(
                    (question) => (
                      <button
                        key={
                          question
                        }
                        type="button"
                        disabled={
                          loading
                        }
                        onClick={() =>
                          askAI(
                            undefined,
                            question
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm leading-5 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {question}
                      </button>
                    )
                  )}
                </div>
              </section>
            )}
          </aside>

          {/* CHAT */}

          <section className="flex min-h-[680px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* CHAT HEADER */}

            <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
              <div className="rounded-xl bg-slate-100 p-2">
                <MessageSquare
                  size={19}
                  className="text-slate-700"
                />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Infrastructure Assistant
                </h2>

                <p className="text-xs text-slate-500">
                  Powered by Groq AI
                </p>
              </div>
            </div>

            {/* MESSAGES */}

            <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
              {!activeReport ? (
                <div className="flex min-h-[550px] items-center justify-center">
                  <div className="max-w-md text-center">

                    <div className="mx-auto mb-5 w-fit rounded-2xl bg-slate-900 p-5 text-white">
                      <Bot size={36} />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">
                      Report-aware AI
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Enter a Report Code above.
                      The assistant will use the
                      real report, linked asset,
                      lifecycle risk, and maintenance
                      history to answer questions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        key={`${item.role}-${index}`}
                        className={`flex ${
                          item.role ===
                          "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                            item.role ===
                            "user"
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-white text-slate-700 shadow-sm"
                          }`}
                        >
                          {item.role ===
                            "assistant" && (
                            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
                              <Bot
                                size={13}
                              />

                              Infra Guard AI
                            </div>
                          )}

                          <div className="whitespace-pre-wrap">
                            {
                              item.content
                            }
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        Analyzing report...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INPUT */}

            <form
              onSubmit={askAI}
              className="border-t border-slate-200 bg-white p-4"
            >
              <div className="flex items-end gap-3">

                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target.value
                    )
                  }
                  disabled={
                    !activeReport ||
                    loading
                  }
                  placeholder={
                    activeReport
                      ? "Ask about this report..."
                      : "Load a report first..."
                  }
                  rows={2}
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();

                      if (
                        activeReport &&
                        message.trim() &&
                        !loading
                      ) {
                        askAI();
                      }
                    }
                  }}
                  className="min-h-[54px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
                />

                <button
                  type="submit"
                  disabled={
                    !activeReport ||
                    !message.trim() ||
                    loading
                  }
                  className="inline-flex h-[54px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={17} />
                  )}

                  Ask
                </button>
              </div>

              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <CheckCircle2
                  size={13}
                />

                Answers are based on the selected report's database data.
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}