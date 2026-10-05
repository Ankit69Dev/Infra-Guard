import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

import Sidebar from "@/components/SideBar";
import OverviewMapWrapper from "@/components/OverviewMapWrapper";

export default async function InfrastructureMapPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Authentication required
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please sign in to access the infrastructure map.
          </p>
        </div>
      </div>
    );
  }

  const [assets, reports] = await Promise.all([
    prisma.infrastructureAsset.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.report.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        reportCode: true,
        title: true,
        description: true,
        type: true,
        status: true,
        department: true,
        latitude: true,
        longitude: true,
        address: true,
        assetId: true,
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

  const mapAssets = assets
    .filter(
      (asset) =>
        Number.isFinite(asset.latitude) &&
        Number.isFinite(asset.longitude)
    )
    .map((asset) => ({
      id: asset.id,
      assetCode: asset.assetCode,
      name: asset.name,
      type: String(asset.type),
      latitude: asset.latitude,
      longitude: asset.longitude,
      locationName: asset.locationName,
      conditionScore: asset.conditionScore,
      riskScore: asset.riskScore,
      riskLevel: asset.riskLevel
        ? String(asset.riskLevel)
        : null,
    }));

  const mapReports = reports
    .filter(
      (report) =>
        Number.isFinite(report.latitude) &&
        Number.isFinite(report.longitude)
    )
    .map((report) => ({
      id: report.id,
      reportCode: report.reportCode,
      title: report.title,
      description: report.description,
      type: String(report.type),
      status: String(report.status),
      department: report.department,
      latitude: report.latitude,
      longitude: report.longitude,
      address: report.address,
      assetId: report.assetId,
      riskScore: report.asset?.riskScore ?? null,
      riskLevel: report.asset?.riskLevel
        ? String(report.asset.riskLevel)
        : null,
      createdAt: report.createdAt.toISOString(),
    }));

  const criticalReports = mapReports.filter(
    (report) =>
      report.riskLevel === "CRITICAL"
  ).length;

  const highReports = mapReports.filter(
    (report) =>
      report.riskLevel === "HIGH"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="min-h-screen">
        <div className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10">
          {/* Header */}
          <div className="mb-7">
            <p className="text-sm font-medium text-slate-500">
              Ranchi, Jharkhand
            </p>

            <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Infrastructure Map
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Explore infrastructure assets and reported issues across Ranchi.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Assets
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {mapAssets.length.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Reports
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {mapReports.length.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Ranchi Infrastructure Network
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Infrastructure assets and citizen-reported issues
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                  <span className="text-slate-600">
                    Critical
                  </span>

                  <span className="font-semibold text-slate-900">
                    {criticalReports}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />

                  <span className="text-slate-600">
                    High
                  </span>

                  <span className="font-semibold text-slate-900">
                    {highReports}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <span className="text-slate-600">
                    Assets
                  </span>

                  <span className="font-semibold text-slate-900">
                    {mapAssets.length.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-[680px] w-full">
              <OverviewMapWrapper
                assets={mapAssets}
                reports={mapReports}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}