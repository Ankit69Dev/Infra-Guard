"use client";

import dynamic from "next/dynamic";

const OverviewMap = dynamic(
  () => import("@/components/OverviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full">
        <div className="flex h-full w-full items-center justify-center bg-slate-100">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Loading infrastructure map...
          </div>
        </div>
      </div>
    ),
  }
);

export interface MapAsset {
  id: string;
  assetCode: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  conditionScore: number | null;
  riskScore: number | null;
  riskLevel: string | null;
}

export interface MapReport {
  id: string;
  reportCode: string;
  title: string;
  description: string;
  type: string;
  riskLevel: string | null;
  riskScore: number | null;
  status: string;
  department: string;
  latitude: number;
  longitude: number;
  address: string | null;
  assetId: string | null;
  createdAt: string;
}

interface OverviewMapWrapperProps {
  assets: MapAsset[];
  reports: MapReport[];
}

export default function OverviewMapWrapper({
  assets,
  reports,
}: OverviewMapWrapperProps) {
  return (
    <div className="h-full w-full">
      <OverviewMap
        assets={assets}
        reports={reports}
      />
    </div>
  );
}