import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  Droplets,
  Gauge,
  Lightbulb,
  MapPin,
  ShieldCheck,
  TrafficCone,
  TrendingUp,
  Wrench,
} from "lucide-react";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

import Sidebar from "@/components/SideBar";
import OverviewMapWrapper from "@/components/OverviewMapWrapper";
import AIInsights from "@/components/AIInsights";
import AssetEnrichmentButton from "@/components/AssetEnrichmentButton";

/* =========================================================
   HELPERS
========================================================= */

function average(
  values: Array<number | null | undefined>
) {
  const valid = values.filter(
    (value): value is number =>
      typeof value === "number" &&
      Number.isFinite(value)
  );

  if (valid.length === 0) {
    return null;
  }

  return (
    valid.reduce(
      (sum, value) => sum + value,
      0
    ) / valid.length
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(
    value
  );
}

function formatPercent(
  value: number | null
) {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value)}%`;
}

function getRiskLabel(
  risk: number | null
) {
  if (risk === null) {
    return "Not scored";
  }

  if (risk >= 80) {
    return "Critical";
  }

  if (risk >= 60) {
    return "High";
  }

  if (risk >= 40) {
    return "Medium";
  }

  return "Low";
}

function getRiskClass(
  risk: number | null
) {
  if (risk === null) {
    return "bg-slate-100 text-slate-500";
  }

  if (risk >= 80) {
    return "bg-red-50 text-red-700";
  }

  if (risk >= 60) {
    return "bg-orange-50 text-orange-700";
  }

  if (risk >= 40) {
    return "bg-yellow-50 text-yellow-700";
  }

  return "bg-emerald-50 text-emerald-700";
}

function typeLabel(type: string) {
  switch (type) {
    case "ROAD":
      return "Road";

    case "BRIDGE":
      return "Bridge";

    case "STREETLIGHT":
      return "Streetlight";

    case "DRAINAGE":
      return "Drainage";

    case "OTHER":
      return "Other";

    default:
      return type.replaceAll("_", " ");
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function DashboardPage() {
  /* -------------------------------------------------------
     Authentication
  ------------------------------------------------------- */

  const session =
    await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck
            className="mx-auto text-slate-400"
            size={36}
          />

          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please sign in to access the Infra Build dashboard.
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     REAL DATABASE DATA
  ------------------------------------------------------- */

  const assets =
    await prisma.infrastructureAsset.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

  /* -------------------------------------------------------
     REAL COUNTS
  ------------------------------------------------------- */

  const totalAssets =
    assets.length;

  const roads =
    assets.filter(
      (asset) =>
        String(asset.type) === "ROAD"
    ).length;

  const bridges =
    assets.filter(
      (asset) =>
        String(asset.type) === "BRIDGE"
    ).length;

  const streetlights =
    assets.filter(
      (asset) =>
        String(asset.type) ===
        "STREETLIGHT"
    ).length;

  const drainage =
    assets.filter(
      (asset) =>
        String(asset.type) ===
          "DRAINAGE" ||
        String(asset.type) ===
          "WATERWAY"
    ).length;

  /* -------------------------------------------------------
     CONDITION / RISK
     
     IMPORTANT:
     We only display these when the database
     actually contains scores.
  ------------------------------------------------------- */

  const averageCondition =
    average(
      assets.map(
        (asset) =>
          asset.conditionScore
      )
    );

  const averageRisk =
    average(
      assets.map(
        (asset) =>
          asset.riskScore
      )
    );

  const scoredRiskAssets =
    assets.filter(
      (asset) =>
        typeof asset.riskScore ===
          "number" &&
        Number.isFinite(
          asset.riskScore
        )
    );

  const criticalRisk =
    scoredRiskAssets.filter(
      (asset) =>
        (asset.riskScore ?? 0) >=
        80
    ).length;

  const highRisk =
    scoredRiskAssets.filter(
      (asset) =>
        (asset.riskScore ?? 0) >=
          60 &&
        (asset.riskScore ?? 0) <
          80
    ).length;

  const mediumRisk =
    scoredRiskAssets.filter(
      (asset) =>
        (asset.riskScore ?? 0) >=
          40 &&
        (asset.riskScore ?? 0) <
          60
    ).length;

  const lowRisk =
    scoredRiskAssets.filter(
      (asset) =>
        (asset.riskScore ?? 0) <
        40
    ).length;

  /* -------------------------------------------------------
     REAL MAP DATA
     
     Limit the browser payload so 27k markers don't
     freeze the page.
  ------------------------------------------------------- */

  const mapAssets =
    assets
      .filter(
        (asset) =>
          typeof asset.latitude ===
            "number" &&
          typeof asset.longitude ===
            "number" &&
          Number.isFinite(
            asset.latitude
          ) &&
          Number.isFinite(
            asset.longitude
          )
      )
      .slice(0, 1000)
      .map((asset) => ({
        id: asset.id,
        assetCode:
          asset.assetCode,
        name:
          asset.name,
        type:
          String(asset.type),
        latitude:
          asset.latitude!,
        longitude:
          asset.longitude!,
        locationName:
          asset.locationName,
        conditionScore:
          asset.conditionScore,
        riskScore:
          asset.riskScore,
      }));

  /* -------------------------------------------------------
     RECENT ASSETS
  ------------------------------------------------------- */

  const recentAssets =
    assets.slice(0, 10);

  /* -------------------------------------------------------
     DATA COMPLETENESS
  ------------------------------------------------------- */

  const assetsWithCoordinates =
    assets.filter(
      (asset) =>
        typeof asset.latitude ===
          "number" &&
        typeof asset.longitude ===
          "number"
    ).length;

  const assetsWithCondition =
    assets.filter(
      (asset) =>
        typeof asset.conditionScore ===
        "number"
    ).length;

  const assetsWithRisk =
    assets.filter(
      (asset) =>
        typeof asset.riskScore ===
        "number"
    ).length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="min-h-screen pl-[72px] lg:pl-[245px]">
        <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">

          {/* =================================================
              HEADER
          ================================================= */}

          <header className="mb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={15} />
                  <span>
                    Ranchi, Jharkhand
                  </span>
                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Infrastructure Overview
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Monitor real infrastructure assets,
                  identify maintenance priorities, and
                  understand city-level infrastructure risk.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <AssetEnrichmentButton />

                <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                    <span className="text-xs font-semibold text-slate-600">
                      Live database
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </header>

          {/* =================================================
              TOP STATS
          ================================================= */}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Total Assets"
              value={formatNumber(totalAssets)}
              description="Infrastructure inventory"
              icon={
                <Building2 size={20} />
              }
              iconClass="bg-blue-50 text-blue-600"
            />

            <StatCard
              title="Roads"
              value={formatNumber(roads)}
              description="Mapped road assets"
              icon={
                <TrafficCone size={20} />
              }
              iconClass="bg-orange-50 text-orange-600"
            />

            <StatCard
              title="Bridges"
              value={formatNumber(bridges)}
              description="Mapped bridge assets"
              icon={
                <Building2 size={20} />
              }
              iconClass="bg-purple-50 text-purple-600"
            />

            <StatCard
              title="Drainage"
              value={formatNumber(drainage)}
              description="Drainage / waterway assets"
              icon={
                <Droplets size={20} />
              }
              iconClass="bg-cyan-50 text-cyan-600"
            />

          </section>

          {/* =================================================
              SECONDARY STATS
          ================================================= */}

          <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <MetricCard
              title="Streetlights"
              value={formatNumber(streetlights)}
              icon={
                <Lightbulb size={18} />
              }
            />

            <MetricCard
              title="Average Condition"
              value={formatPercent(
                averageCondition
              )}
              icon={
                <Gauge size={18} />
              }
              muted={
                averageCondition === null
              }
            />

            <MetricCard
              title="Average Risk"
              value={formatPercent(
                averageRisk
              )}
              icon={
                <TrendingUp size={18} />
              }
              muted={
                averageRisk === null
              }
            />

          </section>

          {/* =================================================
              MAP + RISK
          ================================================= */}

          <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">

            {/* MAP */}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-base font-bold">
                    Infrastructure Map
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Real OpenStreetMap infrastructure
                    stored in Neon
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  <MapPin size={14} />
                  {formatNumber(
                    assetsWithCoordinates
                  )}{" "}
                  mapped
                </div>

              </div>

              <div className="w-full">
                <OverviewMapWrapper
                  assets={mapAssets}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 p-4 sm:grid-cols-4">

                <MapLegend
                  label="Roads"
                  value={roads}
                  icon={
                    <TrafficCone size={14} />
                  }
                />

                <MapLegend
                  label="Bridges"
                  value={bridges}
                  icon={
                    <Building2 size={14} />
                  }
                />

                <MapLegend
                  label="Streetlights"
                  value={streetlights}
                  icon={
                    <Lightbulb size={14} />
                  }
                />

                <MapLegend
                  label="Drainage"
                  value={drainage}
                  icon={
                    <Droplets size={14} />
                  }
                />

              </div>

            </div>

            {/* RISK */}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="flex items-start justify-between">

                <div>
                  <h2 className="text-base font-bold">
                    Risk Intelligence
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Based only on assets with stored
                    risk scores
                  </p>
                </div>

                <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                  <AlertTriangle size={18} />
                </div>

              </div>

              {scoredRiskAssets.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">

                  <ShieldCheck
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    Risk scores not available yet
                  </p>

                  <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    The OSM inventory provides real
                    infrastructure locations, but risk
                    requires condition and operational data.
                  </p>

                </div>
              ) : (
                <div className="mt-6 space-y-4">

                  <RiskRow
                    label="Critical"
                    count={criticalRisk}
                    total={scoredRiskAssets.length}
                    className="bg-red-500"
                  />

                  <RiskRow
                    label="High"
                    count={highRisk}
                    total={scoredRiskAssets.length}
                    className="bg-orange-500"
                  />

                  <RiskRow
                    label="Medium"
                    count={mediumRisk}
                    total={scoredRiskAssets.length}
                    className="bg-yellow-400"
                  />

                  <RiskRow
                    label="Low"
                    count={lowRisk}
                    total={scoredRiskAssets.length}
                    className="bg-emerald-500"
                  />

                </div>
              )}

              <div className="mt-6 rounded-xl bg-slate-50 p-4">

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Scored assets
                  </span>

                  <span className="text-sm font-bold">
                    {formatNumber(
                      scoredRiskAssets.length
                    )}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Average risk
                  </span>

                  <span className="text-sm font-bold">
                    {formatPercent(
                      averageRisk
                    )}
                  </span>
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              AI INSIGHTS
          ================================================= */}

          <section className="mt-6">
            <AIInsights />
          </section>

          {/* =================================================
              DATA COVERAGE
          ================================================= */}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-base font-bold">
                  Data Coverage
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  What is currently available in the
                  infrastructure inventory
                </p>
              </div>

              <ShieldCheck
                size={20}
                className="text-emerald-600"
              />

            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

              <CoverageCard
                title="Geospatial coverage"
                value={
                  assetsWithCoordinates
                }
                total={
                  totalAssets
                }
              />

              <CoverageCard
                title="Condition data"
                value={
                  assetsWithCondition
                }
                total={
                  totalAssets
                }
              />

              <CoverageCard
                title="Risk scores"
                value={
                  assetsWithRisk
                }
                total={
                  totalAssets
                }
              />

            </div>

          </section>

          {/* =================================================
              RECENT ASSETS
          ================================================= */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-base font-bold">
                  Infrastructure Inventory
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Recently added or updated assets
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Building2 size={14} />
                {formatNumber(totalAssets)} total assets
              </div>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left text-sm">

                <thead className="bg-slate-50 text-xs text-slate-500">

                  <tr>
                    <th className="px-5 py-3 font-semibold">
                      Asset
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Type
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Location
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Condition
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      Risk
                    </th>

                    <th className="px-5 py-3 font-semibold">
                      AI Intelligence
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {recentAssets.map(
                    (asset) => (
                      <tr
                        key={asset.id}
                        className="transition hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <div className="font-semibold text-slate-800">
                            {asset.name ||
                              asset.assetCode}
                          </div>

                          <div className="mt-0.5 text-xs text-slate-400">
                            {asset.assetCode}
                          </div>

                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {typeLabel(
                              String(
                                asset.type
                              )
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-1.5 text-xs text-slate-600">

                            <MapPin
                              size={13}
                              className="text-slate-400"
                            />

                            {asset.locationName ||
                              asset.city ||
                              "Ranchi"}

                          </div>

                        </td>

                        <td className="px-5 py-4">

                          <span className="text-sm font-semibold">
                            {asset.conditionScore !==
                            null
                              ? `${Math.round(
                                  asset.conditionScore
                                )}%`
                              : "—"}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getRiskClass(
                              asset.riskScore
                            )}`}
                          >
                            {getRiskLabel(
                              asset.riskScore
                            )}
                          </span>

                        </td>

                        <td className="max-w-[320px] px-5 py-4">

                          {asset.enrichmentSummary ? (
                            <p className="line-clamp-2 text-xs leading-5 text-slate-600">
                              {
                                asset.enrichmentSummary
                              }
                            </p>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Not enriched yet
                            </span>
                          )}

                        </td>

                      </tr>
                    )
                  )}

                  {recentAssets.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center"
                      >
                        <Building2
                          size={28}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No infrastructure assets found
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Seed the Ranchi OSM inventory
                          to populate this dashboard.
                        </p>
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="mt-8 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-2">
              <Wrench size={13} />

              <span>
                Infra Build · Ranchi Infrastructure
                Intelligence
              </span>
            </div>

            <span>
              Source: OpenStreetMap + Infra Build database
            </span>

          </footer>

        </div>
      </main>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-xs font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  muted = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div>
        <p className="text-xs text-slate-500">
          {title}
        </p>

        <p
          className={`mt-1 text-lg font-bold ${
            muted
              ? "text-slate-300"
              : "text-slate-900"
          }`}
        >
          {value}
        </p>
      </div>

      <div className="rounded-lg bg-slate-50 p-2 text-slate-500">
        {icon}
      </div>

    </div>
  );
}

function MapLegend({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {formatNumber(value)}
      </p>

    </div>
  );
}

function RiskRow({
  label,
  count,
  total,
  className,
}: {
  label: string;
  count: number;
  total: number;
  className: string;
}) {
  const percentage =
    total > 0
      ? Math.round(
          (count / total) * 100
        )
      : 0;

  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <span
            className={`h-2.5 w-2.5 rounded-full ${className}`}
          />

          <span className="text-sm font-medium text-slate-600">
            {label}
          </span>

        </div>

        <span className="text-sm font-bold text-slate-800">
          {formatNumber(count)}
        </span>

      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

        <div
          className={`h-full rounded-full ${className}`}
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

    </div>
  );
}

function CoverageCard({
  title,
  value,
  total,
}: {
  title: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">

      <div className="flex items-center justify-between">

        <span className="text-xs font-medium text-slate-500">
          {title}
        </span>

        <span className="text-xs font-bold text-slate-700">
          {percentage}%
        </span>

      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

        <div
          className="h-full rounded-full bg-slate-700"
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <p className="mt-2 text-xs text-slate-400">
        {formatNumber(value)} of{" "}
        {formatNumber(total)} assets
      </p>

    </div>
  );
}