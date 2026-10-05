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
}

interface OverviewMapProps {
  assets: MapAsset[];
}

export default function OverviewMap({
  assets,
}: OverviewMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const resizeHandlerRef = useRef<(() => void) | null>(null);

  /*
   * Create the Leaflet map only once.
   */
  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapContainerRef.current) return;

      const L = await import("leaflet");

      if (cancelled || !mapContainerRef.current) return;
      if (mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([23.3441, 85.3096], 12);

      mapRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }
      ).addTo(map);

      /*
       * Layer for all infrastructure markers.
       */
      layerRef.current = L.layerGroup().addTo(map);

      /*
       * Handle browser/container resizing.
       */
      const handleResize = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      };

      resizeHandlerRef.current = handleResize;

      window.addEventListener("resize", handleResize);

      /*
       * Give Leaflet time to calculate the actual container dimensions.
       */
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (resizeHandlerRef.current) {
        window.removeEventListener(
          "resize",
          resizeHandlerRef.current
        );
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      layerRef.current = null;
    };
  }, []);

  /*
   * Update markers whenever the database assets change.
   */
  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    let cancelled = false;

    async function updateMarkers() {
      const L = await import("leaflet");

      if (cancelled || !mapRef.current || !layerRef.current) {
        return;
      }

      /*
       * Remove previous markers.
       */
      layerRef.current.clearLayers();

      /*
       * Only use real, valid coordinates.
       */
      const validAssets = assets.filter(
        (asset) =>
          Number.isFinite(asset.latitude) &&
          Number.isFinite(asset.longitude) &&
          asset.latitude >= 23.20 &&
          asset.latitude <= 23.55 &&
          asset.longitude >= 85.10 &&
          asset.longitude <= 85.50
      );

      /*
       * IMPORTANT:
       *
       * Don't render all 27k+ OSM assets.
       *
       * Prioritize:
       * 1. Assets with risk scores
       * 2. Highest-risk assets
       * 3. Assets without risk scores afterward
       *
       * This keeps the dashboard responsive.
       */
      const sortedAssets = [...validAssets].sort((a, b) => {
        const riskA =
          typeof a.riskScore === "number"
            ? a.riskScore
            : -1;

        const riskB =
          typeof b.riskScore === "number"
            ? b.riskScore
            : -1;

        return riskB - riskA;
      });

      const MAX_MARKERS = 500;

      const visibleAssets = sortedAssets.slice(
        0,
        MAX_MARKERS
      );

      const bounds: [number, number][] = [];

      visibleAssets.forEach((asset) => {
        const risk =
          typeof asset.riskScore === "number"
            ? asset.riskScore
            : null;

        const markerColor = getRiskColor(risk);

        /*
         * Custom circular marker.
         *
         * This is much easier to visually understand
         * than thousands of identical blue pins.
         */
        const icon = L.divIcon({
          className: "infra-map-marker",
          html: `
            <div
              style="
                width:14px;
                height:14px;
                border-radius:50%;
                background:${markerColor};
                border:2px solid white;
                box-shadow:0 1px 4px rgba(0,0,0,0.35);
              "
            ></div>
          `,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          popupAnchor: [0, -8],
        });

        const marker = L.marker(
          [asset.latitude, asset.longitude],
          {
            icon,
          }
        ).addTo(layerRef.current);

        const condition =
          typeof asset.conditionScore === "number"
            ? `${asset.conditionScore}/100`
            : "Not available";

        const riskText =
          typeof asset.riskScore === "number"
            ? `${asset.riskScore}/100`
            : "Not available";

        const riskLabel =
          risk === null
            ? "No risk score"
            : getRiskLabel(risk);

        marker.bindPopup(`
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
                margin-bottom:4px;
              "
            >
              ${escapeHtml(asset.name || "Unnamed asset")}
            </div>

            <div
              style="
                font-size:11px;
                color:#64748b;
                margin-bottom:9px;
              "
            >
              ${escapeHtml(asset.assetCode)}
            </div>

            <div
              style="
                font-size:13px;
                line-height:1.7;
                color:#334155;
              "
            >

              <strong>Type:</strong>
              ${escapeHtml(formatAssetType(asset.type))}
              <br />

              <strong>Location:</strong>
              ${escapeHtml(asset.locationName || "Ranchi")}
              <br />

              <strong>Condition:</strong>
              ${condition}
              <br />

              <strong>Risk:</strong>
              <span
                style="
                  color:${markerColor};
                  font-weight:700;
                "
              >
                ${riskText}
              </span>

              <br />

              <strong>Status:</strong>
              ${riskLabel}

            </div>

            <div
              style="
                margin-top:9px;
                padding-top:7px;
                border-top:1px solid #e2e8f0;
                font-size:10px;
                color:#94a3b8;
              "
            >
              Coordinates: ${asset.latitude.toFixed(5)},
              ${asset.longitude.toFixed(5)}
            </div>

          </div>
        `);

        bounds.push([
          asset.latitude,
          asset.longitude,
        ]);
      });

      /*
       * Fit the map around the actual Ranchi infrastructure.
       */
      if (bounds.length > 0) {
        mapRef.current.fitBounds(bounds, {
          padding: [25, 25],
          maxZoom: 13,
        });
      } else {
        /*
         * Fallback to Ranchi.
         */
        mapRef.current.setView(
          [23.3441, 85.3096],
          12
        );
      }

      /*
       * Force Leaflet to recalculate dimensions.
       */
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);
    }

    updateMarkers();

    return () => {
      cancelled = true;
    };
  }, [assets]);

  return (
    <div className="relative w-full overflow-hidden">

      {/* MAP */}
      <div
        ref={mapContainerRef}
        className="
          relative
          block
          h-[300px]
          w-full
          overflow-hidden
          rounded-xl
        "
        style={{
          width: "100%",
          height: "300px",
        }}
      />

      {/* LEGEND */}
      <div
        className="
          absolute
          bottom-3
          left-3
          z-[1000]
          rounded-lg
          border
          border-slate-200
          bg-white/95
          px-3
          py-2
          shadow-sm
          backdrop-blur
        "
      >
        <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Infrastructure Risk
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-600">

          <LegendItem
            color="#16a34a"
            label="Low"
          />

          <LegendItem
            color="#eab308"
            label="Medium"
          />

          <LegendItem
            color="#f97316"
            label="High"
          />

          <LegendItem
            color="#dc2626"
            label="Critical"
          />

        </div>
      </div>

      {/* MARKER COUNT */}
      {assets.length > 500 && (
        <div
          className="
            absolute
            right-3
            top-3
            z-[1000]
            rounded-lg
            bg-white/95
            px-3
            py-1.5
            text-[11px]
            font-medium
            text-slate-600
            shadow-sm
            backdrop-blur
          "
        >
          Showing 500 of{" "}
          {assets.length.toLocaleString()} assets
        </div>
      )}
    </div>
  );
}

function LegendItem({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="h-2.5 w-2.5 rounded-full border border-white shadow-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </div>
  );
}

function getRiskColor(
  risk: number | null
) {
  if (risk === null) {
    return "#64748b";
  }

  if (risk >= 80) {
    return "#dc2626";
  }

  if (risk >= 60) {
    return "#f97316";
  }

  if (risk >= 40) {
    return "#eab308";
  }

  return "#16a34a";
}

function getRiskLabel(
  risk: number
) {
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

function formatAssetType(type: string) {
  return type
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}