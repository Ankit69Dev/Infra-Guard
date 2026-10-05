"use client";

import dynamic from "next/dynamic";

type MapAsset = {
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
};

type MapReport = {
  id: string;
  reportCode: string;
  title: string;
  description: string;
  type: string;
  status: string;
  department: string;
  latitude: number;
  longitude: number;
  address: string | null;
  assetId: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  createdAt: string;
};

type Props = {
  assets: MapAsset[];
  reports: MapReport[];
};

const OverviewMapClient = dynamic(
  () => import("./OverviewMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading infrastructure map...
      </div>
    ),
  }
);

export default function OverviewMapWrapper({
  assets,
  reports,
}: Props) {
  return (
    <OverviewMapClient
      assets={assets ?? []}
      reports={reports ?? []}
    />
  );
}