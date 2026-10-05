"use client";

import Link from "next/link";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import L from "leaflet";

import "leaflet/dist/leaflet.css";

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

type DashboardMapProps = {
  reports: Report[];
};

function markerColor(riskLevel: string | null) {
  switch (riskLevel?.toUpperCase()) {
    case "CRITICAL":
      return "#dc2626";

    case "HIGH":
      return "#ea580c";

    case "MEDIUM":
      return "#ca8a04";

    case "LOW":
      return "#16a34a";

    default:
      return "#64748b";
  }
}

function createMarkerIcon(
  riskLevel: string | null
) {
  const color = markerColor(riskLevel);

  const isCritical =
    riskLevel?.toUpperCase() === "CRITICAL";

  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width:34px;
          height:34px;
          border-radius:9999px;
          background:${color};
          border:4px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          display:flex;
          align-items:center;
          justify-content:center;
          ${
            isCritical
              ? "animation:infraReportPulse 1.7s infinite;"
              : ""
          }
        "
      >
        <div
          style="
            width:8px;
            height:8px;
            border-radius:9999px;
            background:white;
          "
        ></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function riskClass(
  riskLevel: string | null
) {
  switch (riskLevel?.toUpperCase()) {
    case "CRITICAL":
      return "bg-red-100 text-red-700";

    case "HIGH":
      return "bg-orange-100 text-orange-700";

    case "MEDIUM":
      return "bg-yellow-100 text-yellow-700";

    case "LOW":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatRiskLevel(
  riskLevel: string | null
) {
  if (!riskLevel) {
    return "Risk pending";
  }

  return riskLevel
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatRiskScore(
  riskScore: number | null
) {
  if (
    riskScore === null ||
    !Number.isFinite(riskScore)
  ) {
    return "Not calculated";
  }

  return `${Math.round(riskScore)}/100`;
}

export default function DashboardMap({
  reports,
}: DashboardMapProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Reports Map
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Geographic view of reported infrastructure issues
            across Ranchi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
          <Legend
            color="bg-red-600"
            label="Critical"
          />

          <Legend
            color="bg-orange-600"
            label="High"
          />

          <Legend
            color="bg-yellow-600"
            label="Medium"
          />

          <Legend
            color="bg-emerald-600"
            label="Low"
          />

          <Legend
            color="bg-slate-500"
            label="Pending"
          />
        </div>
      </div>

      <div className="h-[500px] w-full">
        <MapContainer
          center={[23.3441, 85.3096]}
          zoom={12}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[
                report.latitude,
                report.longitude,
              ]}
              icon={createMarkerIcon(
                report.riskLevel
              )}
            >
              <Popup>
                <div className="min-w-[230px]">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-slate-900">
                      {report.title}
                    </h3>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${riskClass(
                        report.riskLevel
                      )}`}
                    >
                      {formatRiskLevel(
                        report.riskLevel
                      ).toUpperCase()}
                    </span>
                  </div>

                  <p className="mb-3 line-clamp-3 text-xs leading-5 text-slate-500">
                    {report.description}
                  </p>

                  <div className="space-y-1 text-xs text-slate-500">
                    <p>
                      <span className="font-medium text-slate-700">
                        Type:
                      </span>{" "}
                      {report.type}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Risk Level:
                      </span>{" "}
                      {formatRiskLevel(
                        report.riskLevel
                      )}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Risk Score:
                      </span>{" "}
                      {formatRiskScore(
                        report.riskScore
                      )}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Department:
                      </span>{" "}
                      {report.department}
                    </p>

                    <p>
                      <span className="font-medium text-slate-700">
                        Status:
                      </span>{" "}
                      {report.status.replace(
                        /_/g,
                        " "
                      )}
                    </p>

                    {report.address && (
                      <p>
                        <span className="font-medium text-slate-700">
                          Location:
                        </span>{" "}
                        {report.address}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/reports/${report.id}`}
                    className="mt-4 block rounded-lg bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    View Report
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {reports.length === 0 && (
        <div className="border-t border-slate-100 px-5 py-4 text-center text-sm text-slate-500">
          No reports with map locations are available yet.
        </div>
      )}
    </div>
  );
}

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      {label}
    </span>
  );
}