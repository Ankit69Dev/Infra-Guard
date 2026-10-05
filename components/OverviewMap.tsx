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

function createRiskMarker(
  riskLevel: string | null,
  size = 34
) {
  const color = markerColor(riskLevel);

  const isCritical =
    riskLevel?.toUpperCase() === "CRITICAL";

  return L.divIcon({
    className: "infra-risk-marker-wrapper",
    html: `
      <div
        class="infra-risk-marker"
        style="
          --risk-color:${color};
          width:${size}px;
          height:${size}px;
          ${
            isCritical
              ? "animation:infraReportPulse 1.7s infinite;"
              : ""
          }
        "
      >
        <div class="infra-risk-marker-dot">
          <div class="infra-risk-marker-center"></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function createAssetIcon() {
  return L.divIcon({
    className: "infra-asset-marker-wrapper",
    html: `
      <div class="infra-asset-marker">
        <div class="infra-asset-marker-inner"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

function riskClass(riskLevel: string | null) {
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

function formatRiskLevel(riskLevel: string | null) {
  if (!riskLevel) {
    return "Risk pending";
  }

  return riskLevel
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatRiskScore(riskScore: number | null) {
  if (
    riskScore === null ||
    !Number.isFinite(riskScore)
  ) {
    return "Not calculated";
  }

  return `${Math.round(riskScore)}/100`;
}

function formatType(type: string) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

export default function OverviewMapClient({
  assets = [],
  reports = [],
}: Props) {
  return (
    <div className="relative h-full w-full">
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

        {/* Infrastructure assets */}
        {assets.map((asset) => (
          <Marker
            key={`asset-${asset.id}`}
            position={[
              asset.latitude,
              asset.longitude,
            ]}
            icon={createAssetIcon()}
          >
            <Popup>
              <div className="min-w-[230px]">
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-900">
                    {asset.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {asset.assetCode}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <p>
                    <span className="font-medium text-slate-800">
                      Type:
                    </span>{" "}
                    {formatType(asset.type)}
                  </p>

                  {asset.locationName && (
                    <p>
                      <span className="font-medium text-slate-800">
                        Location:
                      </span>{" "}
                      {asset.locationName}
                    </p>
                  )}

                  <p>
                    <span className="font-medium text-slate-800">
                      Risk:
                    </span>{" "}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskClass(
                        asset.riskLevel
                      )}`}
                    >
                      {formatRiskLevel(
                        asset.riskLevel
                      )}
                    </span>
                  </p>

                  <p>
                    <span className="font-medium text-slate-800">
                      Risk Score:
                    </span>{" "}
                    {formatRiskScore(
                      asset.riskScore
                    )}
                  </p>

                  {asset.conditionScore !== null && (
                    <p>
                      <span className="font-medium text-slate-800">
                        Condition:
                      </span>{" "}
                      {Math.round(
                        asset.conditionScore
                      )}/100
                    </p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Risk severity report markers */}
        {reports.map((report) => (
          <Marker
            key={`report-${report.id}`}
            position={[
              report.latitude,
              report.longitude,
            ]}
            icon={createRiskMarker(
              report.riskLevel
            )}
          >
            <Popup>
              <div className="min-w-[240px]">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {report.title}
                    </h3>

                    <p className="mt-1 text-[10px] text-slate-400">
                      {report.reportCode}
                    </p>
                  </div>

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
                    {formatType(report.type)}
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

      {/* Map legend */}
      <div className="absolute bottom-5 left-5 z-[1000] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          Risk severity
        </p>

        <div className="space-y-2">
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

          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-slate-700 bg-white" />

              <span className="text-xs text-slate-600">
                Infrastructure asset
              </span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .infra-risk-marker-wrapper,
        .infra-asset-marker-wrapper {
          background: transparent !important;
          border: none !important;
        }

        .infra-risk-marker {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .infra-risk-marker-dot {
          width: 30px;
          height: 30px;
          border-radius: 9999px;
          background: var(--risk-color);
          border: 4px solid white;
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(15, 23, 42, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .infra-risk-marker-center {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: white;
        }

        .infra-asset-marker {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #475569;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .infra-asset-marker-inner {
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: #475569;
        }

        @keyframes infraReportPulse {
          0% {
            transform: scale(1);
            box-shadow:
              0 2px 8px rgba(0, 0, 0, 0.25),
              0 0 0 0 rgba(220, 38, 38, 0.65);
          }

          70% {
            transform: scale(1.08);
            box-shadow:
              0 2px 8px rgba(0, 0, 0, 0.25),
              0 0 0 12px rgba(220, 38, 38, 0);
          }

          100% {
            transform: scale(1);
            box-shadow:
              0 2px 8px rgba(0, 0, 0, 0.25),
              0 0 0 0 rgba(220, 38, 38, 0);
          }
        }
      `}</style>
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
    <div className="flex items-center gap-2">
      <span
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      <span className="text-xs text-slate-600">
        {label}
      </span>
    </div>
  );
}