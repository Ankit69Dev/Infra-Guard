"use client";

import dynamic from "next/dynamic";

type Report = {
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
};

const DashboardMapClient = dynamic(
  () => import("./DashboardMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        Loading reports map...
      </div>
    ),
  }
);

export default function DashboardMap({
  reports,
}: {
  reports: Report[];
}) {
  return <DashboardMapClient reports={reports ?? []} />;
}