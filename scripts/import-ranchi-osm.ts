import "dotenv/config";
import { writeFile } from "node:fs/promises";

/**
 * Infra Build
 * Ranchi OpenStreetMap / Overpass importer
 *
 * Purpose:
 * 1. Fetch real infrastructure data from OpenStreetMap
 * 2. Normalize OSM objects into Infra Build assets
 * 3. Save the result locally as JSON
 *
 * IMPORTANT:
 * OSM provides geographic/infrastructure information.
 * It does NOT provide our predictive-maintenance fields such as:
 * - conditionScore
 * - complaints90d
 * - maintenanceGapDays
 * - riskScore
 *
 * Those will be added later by Infra Build.
 */

// -----------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------

const OVERPASS_URL =
  process.env.OVERPASS_URL ??
  "https://overpass-api.de/api/interpreter";

/**
 * Ranchi city bounding box.
 *
 * Format:
 * south, west, north, east
 */
const BBOX = {
  south: 23.25,
  west: 85.20,
  north: 23.50,
  east: 85.45,
};

const OUTPUT_FILE = "ranchi-osm-assets.json";

const REQUEST_TIMEOUT_MS = 180_000;

const MAX_RETRIES = 3;

// -----------------------------------------------------
// TYPES
// -----------------------------------------------------

type AssetType =
  | "ROAD"
  | "BRIDGE"
  | "STREETLIGHT"
  | "DRAINAGE"
  | "PUBLIC_INFRASTRUCTURE";

type OSMElement = {
  type: "node" | "way" | "relation";
  id: number;

  lat?: number;
  lon?: number;

  center?: {
    lat: number;
    lon: number;
  };

  tags?: Record<string, string>;
};

type OverpassResponse = {
  version: number;
  generator: string;
  elements: OSMElement[];
};

type NormalizedAsset = {
  osmId: number;
  osmType: OSMElement["type"];

  assetCode: string;
  assetType: AssetType;

  name: string;

  latitude: number;
  longitude: number;

  locationName: string;

  city: string;
  district: string;
  state: string;

  source: "OpenStreetMap";

  surface: string | null;
  lanes: number | null;
  maxSpeed: string | null;

  highway: string | null;
  bridge: string | null;
  waterway: string | null;
  manMade: string | null;

  osmTags: Record<string, string>;
};

// -----------------------------------------------------
// HELPERS
// -----------------------------------------------------

function buildOverpassQuery() {
  const { south, west, north, east } = BBOX;

  return `
[out:json][timeout:180];

(
  /*
   * Roads
   */
  way["highway"](${south},${west},${north},${east});

  /*
   * Bridges
   */
  way["bridge"](${south},${west},${north},${east});

  /*
   * Street lights
   */
  node["highway"="street_lamp"](${south},${west},${north},${east});

  /*
   * Waterways / drainage-related infrastructure
   */
  way["waterway"](${south},${west},${north},${east});

  /*
   * Selected man-made infrastructure
   */
  way["man_made"](${south},${west},${north},${east});
  node["man_made"](${south},${west},${north},${east});
);

out center tags;
`;
}

function getCoordinates(element: OSMElement) {
  if (
    typeof element.lat === "number" &&
    typeof element.lon === "number"
  ) {
    return {
      latitude: element.lat,
      longitude: element.lon,
    };
  }

  if (
    element.center &&
    typeof element.center.lat === "number" &&
    typeof element.center.lon === "number"
  ) {
    return {
      latitude: element.center.lat,
      longitude: element.center.lon,
    };
  }

  return null;
}

function getAssetType(
  tags: Record<string, string>
): AssetType | null {
  if (tags.highway === "street_lamp") {
    return "STREETLIGHT";
  }

  if (tags.bridge === "yes") {
    return "BRIDGE";
  }

  if (tags.waterway) {
    return "DRAINAGE";
  }

  if (tags.highway) {
    return "ROAD";
  }

  if (tags.man_made) {
    return "PUBLIC_INFRASTRUCTURE";
  }

  return null;
}

function getName(
  tags: Record<string, string>,
  type: AssetType,
  osmId: number
) {
  return (
    tags.name ||
    tags["name:en"] ||
    tags["name:hi"] ||
    `${type.replaceAll("_", " ")} ${osmId}`
  );
}

function parseLanes(value?: string) {
  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function createAssetCode(
  osmType: OSMElement["type"],
  osmId: number
) {
  return `OSM-${osmType.toUpperCase()}-${osmId}`;
}

// -----------------------------------------------------
// NORMALIZATION
// -----------------------------------------------------

function normalizeElement(
  element: OSMElement
): NormalizedAsset | null {
  const tags = element.tags ?? {};

  const coordinates = getCoordinates(element);

  if (!coordinates) {
    return null;
  }

  const assetType = getAssetType(tags);

  if (!assetType) {
    return null;
  }

  return {
    osmId: element.id,

    osmType: element.type,

    assetCode: createAssetCode(
      element.type,
      element.id
    ),

    assetType,

    name: getName(
      tags,
      assetType,
      element.id
    ),

    latitude: coordinates.latitude,

    longitude: coordinates.longitude,

    locationName:
      tags["addr:street"] ??
      tags["addr:place"] ??
      tags.name ??
      "Ranchi",

    city: "Ranchi",

    district: "Ranchi",

    state: "Jharkhand",

    source: "OpenStreetMap",

    surface: tags.surface ?? null,

    lanes: parseLanes(tags.lanes),

    maxSpeed: tags.maxspeed ?? null,

    highway: tags.highway ?? null,

    bridge: tags.bridge ?? null,

    waterway: tags.waterway ?? null,

    manMade: tags.man_made ?? null,

    osmTags: tags,
  };
}

// -----------------------------------------------------
// OVERPASS REQUEST
// -----------------------------------------------------

async function fetchOverpassData(
  query: string
): Promise<OverpassResponse> {
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      console.log(
        `Overpass request: attempt ${attempt}/${MAX_RETRIES}`
      );

      const response = await fetch(
        OVERPASS_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
            "User-Agent":
              "InfraBuild/1.0 (Ranchi infrastructure research project)",
          },

          body: `data=${encodeURIComponent(query)}`,

          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(
          `Overpass API returned ${response.status} ${response.statusText}`
        );
      }

      return (await response.json()) as OverpassResponse;
    } catch (error) {
      clearTimeout(timeout);

      lastError = error;

      console.error(
        `Overpass request failed on attempt ${attempt}.`
      );

      if (attempt < MAX_RETRIES) {
        const delay =
          attempt * 3000;

        console.log(
          `Retrying in ${delay / 1000}s...`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );
      }
    }
  }

  throw lastError;
}

// -----------------------------------------------------
// DEDUPLICATION
// -----------------------------------------------------

function deduplicateAssets(
  assets: NormalizedAsset[]
) {
  const unique = new Map<string, NormalizedAsset>();

  for (const asset of assets) {
    const key = `${asset.osmType}-${asset.osmId}`;

    if (!unique.has(key)) {
      unique.set(key, asset);
    }
  }

  return [...unique.values()];
}

// -----------------------------------------------------
// STATISTICS
// -----------------------------------------------------

function printStatistics(
  assets: NormalizedAsset[]
) {
  const counts: Record<string, number> = {};

  for (const asset of assets) {
    counts[asset.assetType] =
      (counts[asset.assetType] ?? 0) + 1;
  }

  console.log("\n----------------------------------------");
  console.log("RANCHI OSM IMPORT SUMMARY");
  console.log("----------------------------------------");

  console.log(
    `Total infrastructure assets: ${assets.length}`
  );

  console.log("\nAsset types:");

  console.table(
    Object.entries(counts).map(
      ([type, count]) => ({
        type,
        count,
      })
    )
  );

  console.log("----------------------------------------\n");
}

// -----------------------------------------------------
// MAIN
// -----------------------------------------------------

async function main() {
  console.log("");
  console.log("========================================");
  console.log("       INFRA BUILD OSM IMPORTER");
  console.log("       Ranchi, Jharkhand");
  console.log("========================================");
  console.log("");

  console.log("Overpass endpoint:");
  console.log(OVERPASS_URL);

  console.log("\nBounding box:");

  console.log(
    `${BBOX.south}, ${BBOX.west}, ${BBOX.north}, ${BBOX.east}`
  );

  console.log(
    "\nFetching real OpenStreetMap infrastructure..."
  );

  const query = buildOverpassQuery();

  const data =
    await fetchOverpassData(query);

  console.log(
    `\nOSM elements received: ${data.elements.length}`
  );

  console.log(
    "\nNormalizing infrastructure..."
  );

  const normalized = data.elements
    .map(normalizeElement)
    .filter(
      (
        asset
      ): asset is NormalizedAsset =>
        asset !== null
    );

  const assets =
    deduplicateAssets(normalized);

  printStatistics(assets);

  console.log(
    "Writing normalized data..."
  );

  await writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      {
        metadata: {
          source: "OpenStreetMap",
          city: "Ranchi",
          district: "Ranchi",
          state: "Jharkhand",

          importedAt:
            new Date().toISOString(),

          boundingBox: BBOX,

          totalAssets:
            assets.length,
        },

        assets,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `Saved ${assets.length} assets to: ${OUTPUT_FILE}`
  );

  console.log(
    "\nImport completed successfully."
  );
}

// -----------------------------------------------------
// ERROR HANDLING
// -----------------------------------------------------

main().catch((error) => {
  console.error("");
  console.error(
    "========================================"
  );
  console.error(
    "          OSM IMPORT FAILED"
  );
  console.error(
    "========================================"
  );

  console.error("");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});
