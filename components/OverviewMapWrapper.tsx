"use client";

import dynamic from "next/dynamic";

const OverviewMap = dynamic(
  () => import("@/components/OverviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full overflow-hidden">
        <div className="flex h-[180px] w-full items-center justify-center rounded-xl bg-slate-100">
          <div className="text-sm text-slate-400">
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
}

interface OverviewMapWrapperProps {
  assets: MapAsset[];
}

export default function OverviewMapWrapper({
  assets,
}: OverviewMapWrapperProps) {
  return (
    <div className="w-full">
      <OverviewMap assets={assets} />
    </div>
  );
}