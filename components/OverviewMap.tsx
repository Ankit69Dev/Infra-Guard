"use client";

import { useEffect, useRef } from "react";

interface MapAsset {
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

interface MapReport {
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

interface OverviewMapProps {
  assets: MapAsset[];
  reports: MapReport[];
}

export default function OverviewMap({
  assets,
  reports,
}: OverviewMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<any>(null);

  const assetLayerRef = useRef<any>(null);
  const reportLayerRef = useRef<any>(null);

  const resizeHandlerRef =
    useRef<(() => void) | null>(null);

  /*
   * =========================================================
   * INITIALIZE MAP
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapContainerRef.current) {
        return;
      }

      const L = await import("leaflet");

      if (
        cancelled ||
        !mapContainerRef.current ||
        mapRef.current
      ) {
        return;
      }

      const map = L.map(
        mapContainerRef.current,
        {
          center: [23.3441, 85.3096],
          zoom: 12,
          scrollWheelZoom: true,
          zoomControl: true,
          attributionControl: true,
          minZoom: 9,
          maxZoom: 19,
        }
      );

      mapRef.current = map;

      /*
       * OpenStreetMap
       */

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 9,
        }
      ).addTo(map);

      /*
       * Separate layers:
       *
       * Assets  = background infrastructure
       * Reports  = primary pointers
       */

      assetLayerRef.current =
        L.layerGroup().addTo(map);

      reportLayerRef.current =
        L.layerGroup().addTo(map);

      /*
       * Resize
       */

      const handleResize = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      };

      resizeHandlerRef.current =
        handleResize;

      window.addEventListener(
        "resize",
        handleResize
      );

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 300);

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 1000);
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (resizeHandlerRef.current) {
        window.removeEventListener(
          "resize",
          resizeHandlerRef.current
        );

        resizeHandlerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      assetLayerRef.current = null;
      reportLayerRef.current = null;
    };
  }, []);

  /*
   * =========================================================
   * UPDATE MAP
   * =========================================================
   */

  useEffect(() => {
    if (
      !mapRef.current ||
      !assetLayerRef.current ||
      !reportLayerRef.current
    ) {
      return;
    }

    let cancelled = false;

    async function updateMap() {
      const L = await import("leaflet");

      if (
        cancelled ||
        !mapRef.current ||
        !assetLayerRef.current ||
        !reportLayerRef.current
      ) {
        return;
      }

      /*
       * Clear previous markers.
       */

      assetLayerRef.current.clearLayers();
      reportLayerRef.current.clearLayers();

      /*
       * =====================================================
       * VALID ASSETS
       * =====================================================
       */

      const validAssets = assets.filter(
        (asset) =>
          Number.isFinite(asset.latitude) &&
          Number.isFinite(asset.longitude) &&
          isRanchiCoordinate(
            asset.latitude,
            asset.longitude
          )
      );

      /*
       * =====================================================
       * VALID REPORTS
       * =====================================================
       */

      const validReports = reports.filter(
        (report) =>
          Number.isFinite(report.latitude) &&
          Number.isFinite(report.longitude) &&
          isRanchiCoordinate(
            report.latitude,
            report.longitude
          )
      );

      /*
       * =====================================================
       * BACKGROUND INFRASTRUCTURE
       * =====================================================
       */

      const MAX_ASSETS = 350;

      validAssets
        .slice(0, MAX_ASSETS)
        .forEach((asset) => {
          const risk =
            typeof asset.riskScore === "number" &&
            Number.isFinite(asset.riskScore)
              ? asset.riskScore
              : null;

          const color =
            risk === null
              ? "#94a3b8"
              : getRiskColor(risk);

          const marker =
            L.circleMarker(
              [
                asset.latitude,
                asset.longitude,
              ],
              {
                radius:
                  risk !== null ? 5 : 4,

                color: "#ffffff",

                weight: 1.5,

                fillColor: color,

                fillOpacity:
                  risk !== null
                    ? 0.7
                    : 0.35,

                opacity: 0.7,

                interactive: true,
              }
            );

          marker.bindPopup(
            createAssetPopup(asset)
          );

          marker.addTo(
            assetLayerRef.current
          );
        });

      /*
       * =====================================================
       * REPORT POINTERS
       * =====================================================
       */

      validReports.forEach(
        (report) => {
          const color =
            getRiskLevelColor(
              report.riskLevel
            );

          const marker =
            L.marker(
              [
                report.latitude,
                report.longitude,
              ],
              {
                icon:
                  createReportIcon(
                    L,
                    color,
                    report.riskLevel
                  ),

                /*
                 * Reports always render above
                 * infrastructure assets.
                 */

                zIndexOffset: 5000,
              }
            );

          marker.bindPopup(
            createReportPopup(
              report,
              color
            ),
            {
              maxWidth: 360,
              minWidth: 280,
              className:
                "infra-report-popup",
            }
          );

          marker.addTo(
            reportLayerRef.current
          );
        }
      );

      /*
       * =====================================================
       * MAP BOUNDS
       * =====================================================
       */

      const bounds: [
        number,
        number
      ][] = [];

      /*
       * Reports take priority.
       */

      validReports.forEach(
        (report) => {
          bounds.push([
            report.latitude,
            report.longitude,
          ]);
        }
      );

      /*
       * If there are no reports,
       * use infrastructure assets.
       */

      if (bounds.length === 0) {
        validAssets
          .slice(0, MAX_ASSETS)
          .forEach((asset) => {
            bounds.push([
              asset.latitude,
              asset.longitude,
            ]);
          });
      }

      if (bounds.length > 0) {
        mapRef.current.fitBounds(
          bounds,
          {
            padding: [70, 70],
            maxZoom: 14,
            animate: false,
          }
        );
      } else {
        mapRef.current.setView(
          [
            23.3441,
            85.3096,
          ],
          12
        );
      }

      /*
       * Final resize.
       */

      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 150);
    }

    updateMap();

    return () => {
      cancelled = true;
    };
  }, [assets, reports]);

  /*
   * =========================================================
   * REPORT RISK STATS
   * =========================================================
   */

  const criticalReports =
    reports.filter(
      (report) =>
        report.riskLevel === "CRITICAL"
    ).length;

  const highReports =
    reports.filter(
      (report) =>
        report.riskLevel === "HIGH"
    ).length;

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* MAP */}

      <div
        ref={mapContainerRef}
        className="absolute inset-0 h-full w-full"
        style={{
          minHeight: "100vh",
        }}
      />

      {/* ===================================================
          REPORT STATUS CARD
      =================================================== */}

      <div
        className="
          absolute
          right-4
          top-4
          z-[1000]
          hidden
          rounded-2xl
          border
          border-slate-200
          bg-white/95
          p-3
          shadow-lg
          backdrop-blur-md
          sm:block
        "
      >
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              bg-red-50
              text-red-600
            "
          >
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active reports
            </p>

            <p className="text-lg font-bold leading-tight text-slate-900">
              {reports.length.toLocaleString(
                "en-IN"
              )}
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <RiskStat
            label="Critical"
            count={criticalReports}
            color="#dc2626"
          />

          <RiskStat
            label="High"
            count={highReports}
            color="#f97316"
          />
        </div>
      </div>

      {/* ===================================================
          LEGEND
      =================================================== */}

      <div
        className="
          absolute
          bottom-5
          left-4
          z-[1000]
          rounded-2xl
          border
          border-slate-200
          bg-white/95
          p-3
          shadow-lg
          backdrop-blur-md
        "
      >
        <div
          className="
            mb-2
            text-[10px]
            font-bold
            uppercase
            tracking-wider
            text-slate-500
          "
        >
          Report risk
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <LegendItem
            color="#dc2626"
            label="Critical"
            pointer
          />

          <LegendItem
            color="#f97316"
            label="High"
            pointer
          />

          <LegendItem
            color="#eab308"
            label="Medium"
            pointer
          />

          <LegendItem
            color="#16a34a"
            label="Low"
            pointer
          />

          <LegendItem
            color="#64748b"
            label="Pending"
            pointer
          />
        </div>

        <div className="mt-3 border-t border-slate-100 pt-2">
          <LegendItem
            color="#94a3b8"
            label="Infrastructure asset"
          />
        </div>
      </div>

      {/* ===================================================
          REPORT COUNT
      =================================================== */}

      <div
        className="
          absolute
          bottom-5
          right-4
          z-[1000]
          rounded-xl
          border
          border-slate-200
          bg-white/95
          px-3
          py-2
          text-xs
          shadow-lg
          backdrop-blur-md
        "
      >
        <span className="font-bold text-slate-900">
          {validReportCount(
            reports
          ).toLocaleString("en-IN")}
        </span>{" "}
        <span className="text-slate-500">
          mapped reports
        </span>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * REPORT MARKER
 * =========================================================
 */

function createReportIcon(
  L: any,
  color: string,
  riskLevel: string | null
) {
  const isCritical =
    riskLevel === "CRITICAL";

  const size = isCritical ? 30 : 26;

  const pulseSize =
    isCritical ? 48 : 40;

  return L.divIcon({
    className:
      "infra-report-marker",

    html: `
      <div
        style="
          position:relative;
          width:${pulseSize}px;
          height:${pulseSize}px;
          transform:translate(
            -${(pulseSize - size) / 2}px,
            -${(pulseSize - size) / 2}px
          );
        "
      >

        <div
          style="
            position:absolute;
            left:50%;
            top:50%;
            width:${size + 4}px;
            height:${size + 4}px;
            transform:translate(-50%,-50%);
            border-radius:50%;
            background:${color};
            opacity:0.16;
            ${
              isCritical
                ? `animation:infraReportPulse 1.7s infinite;`
                : ""
            }
          "
        ></div>

        <div
          style="
            position:absolute;
            left:50%;
            top:50%;
            width:${size}px;
            height:${size}px;
            transform:translate(-50%,-50%);
            border-radius:50% 50% 50% 0;
            background:${color};
            border:3px solid white;
            box-shadow:
              0 3px 12px rgba(15,23,42,0.35);
            rotate:-45deg;
          "
        >
          <div
            style="
              position:absolute;
              left:50%;
              top:50%;
              width:7px;
              height:7px;
              transform:translate(-50%,-50%);
              border-radius:50%;
              background:white;
            "
          ></div>
        </div>

      </div>
    `,

    iconSize: [
      pulseSize,
      pulseSize,
    ],

    iconAnchor: [
      pulseSize / 2,
      pulseSize / 2,
    ],

    popupAnchor: [
      0,
      -(size / 2),
    ],
  });
}

/*
 * =========================================================
 * REPORT POPUP
 * =========================================================
 */

function createReportPopup(
  report: MapReport,
  color: string
) {
  const date = new Date(
    report.createdAt
  );

  const dateText =
    Number.isNaN(date.getTime())
      ? "Unknown date"
      : date.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
            year: "numeric",
          }
        );

  const timeText =
    Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        );

  const riskLabel =
    report.riskLevel
      ? formatRiskLevel(
          report.riskLevel
        )
      : "Risk pending";

  return `
    <div
      style="
        min-width:280px;
        max-width:340px;
        font-family:Arial,sans-serif;
      "
    >

      <!-- HEADER -->

      <div
        style="
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:12px;
          margin-bottom:10px;
        "
      >
        <div>
          <div
            style="
              font-size:16px;
              font-weight:700;
              line-height:1.3;
              color:#0f172a;
            "
          >
            ${escapeHtml(
              report.title
            )}
          </div>

          <div
            style="
              margin-top:3px;
              font-size:10px;
              font-weight:600;
              color:#94a3b8;
            "
          >
            ${escapeHtml(
              report.reportCode
            )}
          </div>
        </div>

        <span
          style="
            flex-shrink:0;
            display:inline-block;
            padding:4px 8px;
            border-radius:999px;
            background:${color}18;
            color:${color};
            font-size:10px;
            font-weight:700;
            text-transform:uppercase;
          "
        >
          ${escapeHtml(
            riskLabel
          )}
        </span>
      </div>

      <!-- DESCRIPTION -->

      <div
        style="
          margin-bottom:12px;
          font-size:12px;
          line-height:1.55;
          color:#475569;
        "
      >
        ${escapeHtml(
          truncate(
            report.description,
            180
          )
        )}
      </div>

      <!-- DETAILS -->

      <div
        style="
          border-top:1px solid #e2e8f0;
          padding-top:9px;
          font-size:11px;
          line-height:1.8;
          color:#475569;
        "
      >

        <div>
          <strong>Type:</strong>
          ${escapeHtml(
            formatType(
              report.type
            )
          )}
        </div>

        <div>
          <strong>Risk score:</strong>
          ${
            typeof report.riskScore ===
              "number" &&
            Number.isFinite(
              report.riskScore
            )
              ? `${report.riskScore}/100`
              : "Pending"
          }
        </div>

        <div>
          <strong>Status:</strong>
          ${escapeHtml(
            formatStatus(
              report.status
            )
          )}
        </div>

        <div>
          <strong>Department:</strong>
          ${escapeHtml(
            report.department
          )}
        </div>

        <div>
          <strong>Location:</strong>
          ${escapeHtml(
            report.address ||
              "Ranchi"
          )}
        </div>

        <div>
          <strong>Reported:</strong>
          ${dateText}
          ${
            timeText
              ? ` · ${timeText}`
              : ""
          }
        </div>
      </div>

      <!-- ACTION -->

      <div
        style="
          margin-top:12px;
        "
      >
        <a
          href="/dashboard/reports/${encodeURIComponent(
            report.id
          )}"
          style="
            display:block;
            width:100%;
            box-sizing:border-box;
            padding:8px 10px;
            border-radius:9px;
            background:#0f172a;
            color:white;
            text-align:center;
            text-decoration:none;
            font-size:11px;
            font-weight:700;
          "
        >
          View report
        </a>
      </div>

      <!-- COORDINATES -->

      <div
        style="
          margin-top:8px;
          font-size:9px;
          color:#94a3b8;
          text-align:center;
        "
      >
        ${report.latitude.toFixed(5)},
        ${report.longitude.toFixed(5)}
      </div>

    </div>
  `;
}

/*
 * =========================================================
 * ASSET POPUP
 * =========================================================
 */

function createAssetPopup(
  asset: MapAsset
) {
  const risk =
    typeof asset.riskScore ===
      "number" &&
    Number.isFinite(
      asset.riskScore
    )
      ? asset.riskScore
      : null;

  const riskColor =
    getRiskColor(risk);

  const riskLabel =
    asset.riskLevel
      ? formatRiskLevel(
          asset.riskLevel
        )
      : "Not scored";

  return `
    <div
      style="
        min-width:230px;
        font-family:Arial,sans-serif;
      "
    >

      <div
        style="
          font-size:15px;
          font-weight:700;
          color:#0f172a;
          margin-bottom:3px;
        "
      >
        ${escapeHtml(
          asset.name ||
            "Infrastructure asset"
        )}
      </div>

      <div
        style="
          font-size:10px;
          color:#94a3b8;
          margin-bottom:10px;
        "
      >
        ${escapeHtml(
          asset.assetCode
        )}
      </div>

      <div
        style="
          font-size:12px;
          line-height:1.8;
          color:#475569;
        "
      >
        <strong>Type:</strong>
        ${escapeHtml(
          formatType(
            asset.type
          )
        )}

        <br />

        <strong>Location:</strong>
        ${escapeHtml(
          asset.locationName ||
            "Ranchi"
        )}

        <br />

        <strong>Risk:</strong>

        <span
          style="
            color:${riskColor};
            font-weight:700;
          "
        >
          ${
            risk === null
              ? riskLabel
              : `${riskLabel} · ${risk}/100`
          }
        </span>
      </div>
    </div>
  `;
}

/*
 * =========================================================
 * RISK LEVEL COLOR
 * =========================================================
 */

function getRiskLevelColor(
  riskLevel: string | null
) {
  switch (
    riskLevel?.toUpperCase()
  ) {
    case "CRITICAL":
      return "#dc2626";

    case "HIGH":
      return "#f97316";

    case "MEDIUM":
      return "#eab308";

    case "LOW":
      return "#16a34a";

    default:
      return "#64748b";
  }
}

/*
 * =========================================================
 * RISK SCORE COLOR
 * =========================================================
 */

function getRiskColor(
  risk: number | null
) {
  if (risk === null) {
    return "#94a3b8";
  }

  if (risk >= 75) {
    return "#dc2626";
  }

  if (risk >= 50) {
    return "#f97316";
  }

  if (risk >= 25) {
    return "#eab308";
  }

  return "#16a34a";
}

/*
 * =========================================================
 * RISK LABEL
 * =========================================================
 */

function formatRiskLevel(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

/*
 * =========================================================
 * LEGEND
 * =========================================================
 */

function LegendItem({
  color,
  label,
  pointer = false,
}: {
  color: string;
  label: string;
  pointer?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
      <span
        className={
          pointer
            ? "relative h-3 w-3 rounded-full border-2 border-white shadow-sm"
            : "h-2.5 w-2.5 rounded-full border border-white shadow-sm"
        }
        style={{
          backgroundColor:
            color,
        }}
      />

      <span>{label}</span>
    </div>
  );
}

/*
 * =========================================================
 * RISK STATS
 * =========================================================
 */

function RiskStat({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg px-2.5 py-1.5"
      style={{
        backgroundColor:
          `${color}10`,
      }}
    >
      <div
        className="text-[9px] font-bold uppercase tracking-wide"
        style={{
          color,
        }}
      >
        {label}
      </div>

      <div className="text-xs font-bold text-slate-800">
        {count}
      </div>
    </div>
  );
}

/*
 * =========================================================
 * RANCHI BOUNDS
 * =========================================================
 */

function isRanchiCoordinate(
  latitude: number,
  longitude: number
) {
  return (
    latitude >= 23.20 &&
    latitude <= 23.55 &&
    longitude >= 85.10 &&
    longitude <= 85.50
  );
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function validReportCount(
  reports: MapReport[]
) {
  return reports.filter(
    (report) =>
      Number.isFinite(
        report.latitude
      ) &&
      Number.isFinite(
        report.longitude
      ) &&
      isRanchiCoordinate(
        report.latitude,
        report.longitude
      )
  ).length;
}

function formatType(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function formatStatus(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function truncate(
  value: string,
  maxLength: number
) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(
    0,
    maxLength
  )}...`;
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}