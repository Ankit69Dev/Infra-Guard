import "dotenv/config";

import fs from "fs";
import path from "path";

import { PrismaClient, AssetType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/* =========================================================
   DATABASE
========================================================= */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Check your .env file."
  );
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

/* =========================================================
   CONFIG
========================================================= */

const JSON_PATH = path.join(
  process.cwd(),
  "ranchi-osm-assets.json"
);

const BATCH_SIZE = 500;

/* =========================================================
   TYPES
========================================================= */

type NormalizedAsset = {
  osmId?: number | string | null;

  assetCode: string;

  assetType?: string | null;

  name?: string | null;

  latitude?: number | string | null;
  longitude?: number | string | null;

  locationName?: string | null;

  city?: string | null;
  district?: string | null;
  state?: string | null;

  source?: string | null;

  surface?: string | null;
  lanes?: string | number | null;
  maxspeed?: string | number | null;

  highway?: string | null;
  bridge?: string | null;
  waterway?: string | null;
  manMade?: string | null;

  tags?: Record<string, unknown> | null;
};

/* =========================================================
   ASSET TYPE MAPPING
========================================================= */

function mapAssetType(
  assetType: string | null | undefined
): AssetType {
  switch (String(assetType ?? "").toUpperCase()) {
    case "ROAD":
      return AssetType.ROAD;

    case "BRIDGE":
      return AssetType.BRIDGE;

    case "STREETLIGHT":
      return AssetType.STREETLIGHT;

    case "DRAINAGE":
      return AssetType.DRAINAGE;

    case "WATERWAY":
      return AssetType.DRAINAGE;

    case "PUBLIC_INFRASTRUCTURE":
      return AssetType.OTHER;

    default:
      return AssetType.OTHER;
  }
}

/* =========================================================
   HELPERS
========================================================= */

function cleanString(
  value: unknown
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return String(value);
}

function cleanNumber(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue;
}

function buildDescription(
  asset: NormalizedAsset
): string {
  return JSON.stringify({
    source:
      asset.source ??
      "OpenStreetMap",

    osm_id:
      asset.osmId ??
      null,

    surface:
      asset.surface ??
      null,

    lanes:
      asset.lanes ??
      null,

    maxspeed:
      asset.maxspeed ??
      null,

    highway:
      asset.highway ??
      null,

    bridge:
      asset.bridge ??
      null,

    waterway:
      asset.waterway ??
      null,

    man_made:
      asset.manMade ??
      null,

    tags:
      asset.tags ??
      {},
  });
}

/* =========================================================
   READ JSON
========================================================= */

function loadAssets(): NormalizedAsset[] {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(
      `OSM JSON file not found:\n${JSON_PATH}`
    );
  }

  const raw = fs.readFileSync(
    JSON_PATH,
    "utf8"
  );

  const parsed = JSON.parse(raw);

  /*
   * Format 1:
   *
   * [
   *   {...},
   *   {...}
   * ]
   */

  if (Array.isArray(parsed)) {
    return parsed as NormalizedAsset[];
  }

  /*
   * Format 2:
   *
   * {
   *   "assets": [...]
   * }
   */

  if (
    parsed &&
    Array.isArray(parsed.assets)
  ) {
    return parsed.assets as NormalizedAsset[];
  }

  /*
   * Format 3:
   *
   * {
   *   "data": [...]
   * }
   */

  if (
    parsed &&
    Array.isArray(parsed.data)
  ) {
    return parsed.data as NormalizedAsset[];
  }

  /*
   * Format 4:
   *
   * {
   *   "results": [...]
   * }
   */

  if (
    parsed &&
    Array.isArray(parsed.results)
  ) {
    return parsed.results as NormalizedAsset[];
  }

  throw new Error(
    "Invalid ranchi-osm-assets.json format. Expected an array or an object containing assets, data, or results."
  );
}

/* =========================================================
   MAIN
========================================================= */

async function main() {
  console.log("");
  console.log("======================================");
  console.log(" Ranchi Infrastructure Seeder");
  console.log("======================================");
  console.log("");

  /* -------------------------------------------------------
     Load assets
  ------------------------------------------------------- */

  const assets = loadAssets();

  console.log(
    `Assets found in JSON: ${assets.length}`
  );

  console.log(
    `Batch size: ${BATCH_SIZE}`
  );

  console.log("");

  /* -------------------------------------------------------
     Validate and deduplicate
  ------------------------------------------------------- */

  const uniqueAssets =
    new Map<string, NormalizedAsset>();

  let skipped = 0;

  for (const asset of assets) {
    if (
      !asset ||
      typeof asset !== "object"
    ) {
      skipped++;
      continue;
    }

    if (!asset.assetCode) {
      skipped++;
      continue;
    }

    const latitude =
      cleanNumber(asset.latitude);

    const longitude =
      cleanNumber(asset.longitude);

    /*
     * Coordinates are required because
     * these assets will appear on the map.
     */

    if (
      latitude === null ||
      longitude === null
    ) {
      skipped++;
      continue;
    }

    /*
     * Store cleaned coordinates.
     */

    const cleanedAsset: NormalizedAsset = {
      ...asset,

      latitude,
      longitude,
    };

    /*
     * Prevent duplicate asset codes.
     */

    uniqueAssets.set(
      asset.assetCode,
      cleanedAsset
    );
  }

  const cleanAssets =
    Array.from(
      uniqueAssets.values()
    );

  console.log(
    `Unique valid assets: ${cleanAssets.length}`
  );

  console.log(
    `Skipped invalid assets: ${skipped}`
  );

  console.log("");

  /* -------------------------------------------------------
     Counters
  ------------------------------------------------------- */

  let created = 0;
  let updated = 0;
  let failed = 0;

  /* -------------------------------------------------------
     Process batches
  ------------------------------------------------------- */

  for (
    let start = 0;
    start < cleanAssets.length;
    start += BATCH_SIZE
  ) {
    const batch =
      cleanAssets.slice(
        start,
        start + BATCH_SIZE
      );

    const end = Math.min(
      start + batch.length,
      cleanAssets.length
    );

    console.log(
      `Processing ${start + 1}-${end} / ${cleanAssets.length}`
    );

    /* -----------------------------------------------------
       Find existing assets
    ----------------------------------------------------- */

    const assetCodes =
      batch.map(
        (asset) =>
          asset.assetCode
      );

    let existing: {
      assetCode: string;
    }[] = [];

    try {
      existing =
        await prisma.infrastructureAsset.findMany({
          where: {
            assetCode: {
              in: assetCodes,
            },
          },

          select: {
            assetCode: true,
          },
        });
    } catch (error) {
      console.error(
        "Failed to query existing assets for this batch."
      );

      console.error(error);

      failed += batch.length;

      continue;
    }

    const existingCodes =
      new Set(
        existing.map(
          (asset) =>
            asset.assetCode
        )
      );

    /* -----------------------------------------------------
       Prepare rows
    ----------------------------------------------------- */

    const rows = batch.map(
      (asset) => ({
        assetCode:
          asset.assetCode,

        name:
          cleanString(
            asset.name
          ) ??
          asset.assetCode,

        type:
          mapAssetType(
            asset.assetType
          ),

        /*
         * IMPORTANT:
         *
         * Prisma uses latitude / longitude.
         *
         * Do NOT change these to lat / long.
         */

        latitude:
          asset.latitude as number,

        longitude:
          asset.longitude as number,

        locationName:
          cleanString(
            asset.locationName
          ),

        city:
          cleanString(
            asset.city
          ) ??
          "Ranchi",

        district:
          cleanString(
            asset.district
          ) ??
          "Ranchi",

        state:
          cleanString(
            asset.state
          ) ??
          "Jharkhand",

        description:
          buildDescription(
            asset
          ),
      })
    );

    /* -----------------------------------------------------
       CREATE NEW ASSETS
    ----------------------------------------------------- */

    const newRows =
      rows.filter(
        (row) =>
          !existingCodes.has(
            row.assetCode
          )
      );

    if (newRows.length > 0) {
      try {
        const result =
          await prisma.infrastructureAsset.createMany(
            {
              data: newRows,
              skipDuplicates: true,
            }
          );

        created += result.count;
      } catch (error) {
        console.error(
          `Bulk insert failed for batch ${start + 1}-${end}`
        );

        console.error(error);

        failed += newRows.length;
      }
    }

    /* -----------------------------------------------------
       UPDATE EXISTING ASSETS
    ----------------------------------------------------- */

    const existingRows =
      rows.filter(
        (row) =>
          existingCodes.has(
            row.assetCode
          )
      );

    for (const row of existingRows) {
      try {
        await prisma.infrastructureAsset.update({
          where: {
            assetCode:
              row.assetCode,
          },

          data: {
            name:
              row.name,

            type:
              row.type,

            latitude:
              row.latitude,

            longitude:
              row.longitude,

            locationName:
              row.locationName,

            city:
              row.city,

            district:
              row.district,

            state:
              row.state,

            description:
              row.description,
          },
        });

        updated++;
      } catch (error) {
        failed++;

        console.error(
          `Failed to update ${row.assetCode}`
        );

        console.error(error);
      }
    }

    /* -----------------------------------------------------
       Progress
    ----------------------------------------------------- */

    console.log(
      `  Created: ${created}`
    );

    console.log(
      `  Updated: ${updated}`
    );

    console.log(
      `  Failed:  ${failed}`
    );

    console.log("");

    /*
     * Give Neon a short break between batches.
     */

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 100)
    );
  }

  /* =======================================================
     FINAL RESULT
  ======================================================= */

  console.log("");
  console.log("======================================");
  console.log(" Seeding complete");
  console.log("======================================");
  console.log("");

  console.log(
    `JSON assets:       ${assets.length}`
  );

  console.log(
    `Valid unique:      ${cleanAssets.length}`
  );

  console.log(
    `Created:           ${created}`
  );

  console.log(
    `Updated:           ${updated}`
  );

  console.log(
    `Skipped:           ${skipped}`
  );

  console.log(
    `Failed:            ${failed}`
  );

  console.log("");

  /* -------------------------------------------------------
     Verify Neon
  ------------------------------------------------------- */

  try {
    const total =
      await prisma.infrastructureAsset.count();

    console.log(
      `Assets currently in Neon: ${total}`
    );
  } catch (error) {
    console.error(
      "Could not verify final Neon count."
    );

    console.error(error);
  }

  console.log("");
}

/* =========================================================
   START
========================================================= */

main()
  .catch((error) => {
    console.error("");
    console.error("======================================");
    console.error(" SEED FAILED");
    console.error("======================================");
    console.error("");

    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });