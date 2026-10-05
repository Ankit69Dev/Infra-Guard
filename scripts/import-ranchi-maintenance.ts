import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const RMC_TENDERS_URL = "https://ranchimunicipal.com/Tenders.aspx";

type TenderRecord = {
  publishedDate: string;
  reference: string;
  title: string;
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

function extractTenders(html: string): TenderRecord[] {
  const records: TenderRecord[] = [];

  const rowMatches = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  for (const row of rowMatches) {
    const cells =
      row.match(/<td[\s\S]*?<\/td>/gi)?.map(stripHtml) ?? [];

    if (cells.length < 4) {
      continue;
    }

    const publishedDate = cells[1];
    const reference = cells[2];
    const title = cells[3];

    if (!publishedDate || !reference || !title) {
      continue;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(publishedDate)) {
      continue;
    }

    records.push({
      publishedDate,
      reference,
      title,
    });
  }

  return records;
}

function isInfrastructureTender(title: string) {
  const normalized = title.toLowerCase();

  return (
    normalized.includes("construction of road") ||
    normalized.includes("construction of drain") ||
    normalized.includes("road and drain") ||
    normalized.includes("road repair") ||
    normalized.includes("road maintenance") ||
    normalized.includes("road improvement") ||
    normalized.includes("bituminous road") ||
    normalized.includes("resurfacing")
  );
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  console.log("Fetching Ranchi Municipal Corporation tenders...");

  const response = await fetch(RMC_TENDERS_URL, {
    headers: {
      "User-Agent": "InfraBuild/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `RMC request failed: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  const tenders = extractTenders(html).filter((tender) =>
    isInfrastructureTender(tender.title)
  );

  console.log(
    `Found ${tenders.length} road/drain infrastructure tender records.`
  );

  if (tenders.length === 0) {
    console.log("Nothing to import.");
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const tender of tenders) {
    const projectDate = parseDate(tender.publishedDate);

    if (!projectDate) {
      skipped++;

      console.log(
        `SKIPPED INVALID DATE: ${tender.reference} - ${tender.title}`
      );

      continue;
    }

    const projectCode = tender.reference.trim();
    const title = tender.title.trim();

    /*
     * We intentionally do NOT match these projects to an asset here.
     *
     * Many RMC records describe multiple roads/drains or multiple
     * schemes at once. Without enough location-specific evidence,
     * attaching them to a particular InfrastructureAsset would create
     * false maintenance history.
     *
     * matchedAssetId therefore remains null.
     */

    const existing = await prisma.officialProject.findUnique({
      where: {
        projectCode_title: {
          projectCode,
          title,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      skipped++;

      console.log(
        `ALREADY EXISTS: ${projectCode} - ${title}`
      );

      continue;
    }

    await prisma.officialProject.create({
      data: {
        projectCode,
        title,

        assetType: "ROAD",

        projectDate,

        department: "Ranchi Municipal Corporation",

        source: "Ranchi Municipal Corporation",

        sourceUrl: RMC_TENDERS_URL,

        matchedAssetId: null,
      },
    });

    imported++;

    console.log(
      `IMPORTED: ${projectCode} - ${title}`
    );
  }

  console.log("");
  console.log("Official project import complete.");
  console.log(`Imported: ${imported}`);
  console.log(`Skipped:  ${skipped}`);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });