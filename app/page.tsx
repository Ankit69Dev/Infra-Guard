
"use client";

import {
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Droplets,
  Lightbulb,
  MapPin,
  Route,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from "lucide-react";

const stats = [
  { value: "5,240", label: "Assets monitored" },
  { value: "327", label: "High-risk assets" },
  { value: "64", label: "Critical assets" },
  { value: "218", label: "Maintenance predicted" },
];

const infrastructure = [
  {
    icon: Route,
    title: "Roads",
    description: "Detect deterioration before small problems become expensive repairs.",
  },
  {
    icon: Building2,
    title: "Bridges",
    description: "Prioritize inspections based on condition, age and usage.",
  },
  {
    icon: Lightbulb,
    title: "Streetlights",
    description: "Identify assets likely to fail and reduce service disruptions.",
  },
  {
    icon: Droplets,
    title: "Drainage",
    description: "Predict blockage and flooding risks before heavy rainfall.",
  },
];

const steps = [
  {
    number: "01",
    title: "Collect",
    description:
      "Bring together maintenance records, inspections, complaints and environmental data.",
  },
  {
    number: "02",
    title: "Predict",
    description:
      "Our prediction engine analyzes asset condition and estimates maintenance risk.",
  },
  {
    number: "03",
    title: "Prioritize",
    description:
      "Rank assets based on risk, urgency, impact and available maintenance resources.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f8f5] text-slate-900">
      {/* Navbar */}
      <nav className="border-b border-slate-200/80 bg-[#f7f8f5]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <a href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">FixFirst</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="transition hover:text-slate-950">
              How it works
            </a>
            <a href="#infrastructure" className="transition hover:text-slate-950">
              Infrastructure
            </a>
            <a href="#impact" className="transition hover:text-slate-950">
              Impact
            </a>
          </div>

          <a
            href="/dashboard"
            className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-20 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-28 lg:pt-28">
          {/* Hero copy */}
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Predictive infrastructure maintenance
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              Fix problems
              <br />
              <span className="text-slate-500">before they fail.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
              FixFirst helps cities predict which infrastructure needs
              attention, understand why, and decide what to fix first.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 font-semibold text-white transition hover:bg-slate-700"
              >
                Explore the dashboard
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                No IoT required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                AI-powered predictions
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Actionable recommendations
              </div>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-emerald-100/50 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_25px_80px_-30px_rgba(15,23,42,0.3)]">
              {/* Fake map */}
              <div className="relative h-[430px] overflow-hidden bg-[#e9eee7]">
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, transparent 48%, #cbd5c5 49%, #cbd5c5 51%, transparent 52%), linear-gradient(-45deg, transparent 48%, #d5dbd0 49%, #d5dbd0 51%, transparent 52%)",
                    backgroundSize: "100px 100px",
                  }}
                />

                <div className="absolute left-[12%] top-[22%] h-2/3 w-1 rotate-12 bg-white/80" />
                <div className="absolute left-[48%] top-[-5%] h-[115%] w-2 rotate-[67deg] bg-white/80" />
                <div className="absolute right-[16%] top-[5%] h-[110%] w-1 rotate-[18deg] bg-white/80" />
                <div className="absolute bottom-[25%] left-[-5%] h-1 w-[110%] rotate-[-15deg] bg-white/80" />

                {/* Risk markers */}
                <RiskMarker
                  className="left-[22%] top-[28%]"
                  color="bg-red-500"
                  label="91%"
                />
                <RiskMarker
                  className="left-[58%] top-[39%]"
                  color="bg-orange-500"
                  label="79%"
                />
                <RiskMarker
                  className="left-[36%] top-[62%]"
                  color="bg-red-500"
                  label="87%"
                />
                <RiskMarker
                  className="right-[18%] top-[67%]"
                  color="bg-yellow-400"
                  label="58%"
                />

                {/* Map header */}
                <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                  <div className="rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
                    <p className="text-xs font-medium text-slate-500">
                      CITY INFRASTRUCTURE
                    </p>
                    <p className="mt-0.5 font-semibold">Live risk overview</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-medium shadow-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    5,240 assets
                  </div>
                </div>

                {/* Bottom card */}
                <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Highest priority
                      </p>
                      <p className="mt-1 font-bold">Bridge B-12</p>
                    </div>

                    <div className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600">
                      91% risk
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[91%] rounded-full bg-red-500" />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Structural inspection recommended</span>
                    <span className="font-semibold text-slate-700">
                      Within 7 days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="impact" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-6 py-8 lg:px-10 ${
                index !== 0 ? "border-l border-slate-200" : ""
              }`}
            >
              <p className="text-3xl font-bold tracking-tight text-slate-950">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              How it works
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              From city data to a maintenance decision.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              FixFirst combines existing infrastructure information and AI
              predictions to help maintenance teams focus on the assets that
              matter most.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-3xl border border-slate-200 bg-white p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">
                    {step.number}
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>

                <h3 className="mt-12 text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="infrastructure" className="bg-slate-950 px-6 py-24 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">
                Infrastructure
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Built for the things that keep a city moving.
              </h2>
            </div>

            <p className="max-w-md leading-7 text-slate-400">
              Start with existing records and expand to sensors, real-time
              feeds and other data sources as your infrastructure network
              grows.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-slate-800 bg-slate-800 md:grid-cols-2">
            {infrastructure.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="bg-slate-950 p-8 transition hover:bg-slate-900"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
                    <Icon className="h-6 w-6 text-emerald-400" />
                  </div>

                  <h3 className="mt-7 text-xl font-bold">{item.title}</h3>
                  <p className="mt-3 max-w-md leading-7 text-slate-400">
                    {item.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                    Monitor & predict
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI feature */}
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-3xl bg-emerald-50">
            <div className="grid items-center gap-12 p-8 md:p-12 lg:grid-cols-2 lg:p-16">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Brain className="h-6 w-6 text-emerald-700" />
                </div>

                <h2 className="mt-7 text-4xl font-bold tracking-tight">
                  Don't just predict risk.
                  <br />
                  <span className="text-emerald-700">Explain it.</span>
                </h2>

                <p className="mt-5 max-w-xl leading-8 text-slate-600">
                  Every prediction comes with the factors behind it, so
                  engineers can understand the recommendation and make the
                  final decision.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "Poor infrastructure condition",
                    "12 recent citizen complaints",
                    "Heavy traffic exposure",
                    "High rainfall exposure",
                  ].map((reason) => (
                    <div key={reason} className="flex items-center gap-3">
                      <CircleAlert className="h-5 w-5 text-orange-500" />
                      <span className="font-medium text-slate-700">
                        {reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      AI assessment
                    </p>
                    <h3 className="mt-1 text-xl font-bold">Road R-104</h3>
                  </div>

                  <span className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-bold text-red-600">
                    Critical
                  </span>
                </div>

                <div className="mt-8">
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-slate-500">
                      Maintenance probability
                    </span>
                    <span className="text-3xl font-bold">87%</span>
                  </div>

                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[87%] rounded-full bg-red-500" />
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <p className="text-sm font-bold text-slate-900">
                    Recommended action
                  </p>
                  <p className="mt-2 leading-6 text-slate-600">
                    Inspect and repair damaged road surface within 7 days.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Estimated impact: 8,500 daily road users
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 px-8 py-16 text-center text-white md:px-16">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400" />

          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Don't wait for infrastructure to fail.
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">
            Use data and AI to decide what your city should fix first.
          </p>

          <a
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Open FixFirst dashboard
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Wrench className="h-4 w-4" />
            FixFirst
          </div>

          <p>Predict. Prioritize. Prevent.</p>
        </div>
      </footer>
    </main>
  );
}

function RiskMarker({
  className,
  color,
  label,
}: {
  className: string;
  color: string;
  label: string;
}) {
  return (
    <div className={`absolute ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        <span
          className={`absolute h-10 w-10 animate-ping rounded-full ${color} opacity-20`}
        />
        <span
          className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white ${color} text-[9px] font-bold text-white shadow-lg`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
