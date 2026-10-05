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

const RCD_REPORT_URL =
  "https://www.jharkhand.gov.in/PDepartment/ViewDocument?id=D023DO00616072025030928091";

type RcdProject = {
  projectCode: string;
  title: string;
  assetType: "ROAD" | "BRIDGE" | "DRAINAGE" | "STREETLIGHT";
  projectDate: Date;
  amount?: number | null;
  agreementAmount?: number | null;
  physicalProgress?: number | null;
  financialProgress?: number | null;
  scheduledDate?: Date | null;
  contractor?: string | null;
};

function cleanText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value
    .replace(/,/g, "")
    .replace(/%/g, "")
    .trim();

  const match = cleaned.match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return null;
  }

  const number = Number(match[0]);

  return Number.isFinite(number) ? number : null;
}

function parseDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();

  const match = cleaned.match(
    /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/
  );

  if (!match) {
    return null;
  }

  let [, day, month, year] = match;

  let numericYear = Number(year);

  if (numericYear < 100) {
    numericYear += 2000;
  }

  const date = new Date(
    numericYear,
    Number(month) - 1,
    Number(day)
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bthe\b/g, " ")
    .replace(/\byear\b/g, " ")
    .replace(/\bfor\b/g, " ")
    .replace(/\bwork\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a: string, b: string) {
  const left = new Set(normalizeTitle(a).split(" "));
  const right = new Set(normalizeTitle(b).split(" "));

  if (!left.size || !right.size) {
    return 0;
  }

  let intersection = 0;

  for (const word of left) {
    if (right.has(word)) {
      intersection++;
    }
  }

  return intersection / Math.max(left.size, right.size);
}

function extractRows(html: string) {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];

  return rows
    .map((row) => {
      const cells =
        row.match(/<td[\s\S]*?<\/td>/gi)?.map(cleanText) ?? [];

      return cells;
    })
    .filter((cells) => cells.length >= 8);
}

function extractRanchiProjects(html: string): RcdProject[] {
  const rows = extractRows(html);

  const projects: RcdProject[] = [];

  let ranchiSection = false;
  let rowNumber = 0;

  for (const cells of rows) {
    const joined = cells.join(" ");

    if (/Circle\s*:\s*RANCHI/i.test(joined)) {
      ranchiSection = true;
      continue;
    }

    if (
      ranchiSection &&
      /Circle\s*:/i.test(joined) &&
      !/Circle\s*:\s*RANCHI/i.test(joined)
    ) {
      ranchiSection = false;
    }

    if (!ranchiSection) {
      continue;
    }

    const firstCell = cells[0]?.trim();

    if (!/^\d+$/.test(firstCell || "")) {
      continue;
    }

    const title = cells[1]?.trim();

    if (!title || title.length < 15) {
      continue;
    }

    rowNumber++;

    /*
     * RCD June 2025 report structure:
     *
     * 0 = serial
     * 1 = scheme name
     * 2 = length
     * 3 = sanctioned amount
     * 4 = sanctioned reference/date
     * 5 = agreement amount
     * 6 = agreement reference/date
     * 7 = financial progress
     * 8 = financial achievement %
     * 9 = physical achievement %
     * 10 = scheduled date
     * 11 = contractor
     */

    const sanctionedAmount = parseNumber(cells[3]);
    const agreementAmount = parseNumber(cells[5]);
    const financialProgress = parseNumber(cells[8]);
    const physicalProgress = parseNumber(cells[9]);

    const scheduledDate =
      parseDate(cells[10]) ||
      parseDate(cells[10]?.replace(/\s+/g, ""));

    const contractor =
      cells[11] && cells[11] !== "-" ? cells[11] : null;

    projects.push({
      projectCode: `RCD-RANCHI-JUN2025-${rowNumber}`,
      title,
      assetType: /drain/i.test(title)
        ? "DRAINAGE"
        : /bridge|fly over|flyover|ROB|culvert/i.test(title)
          ? "BRIDGE"
          : "ROAD",
      projectDate: new Date("2025-06-30"),
      amount: sanctionedAmount,
      agreementAmount,
      physicalProgress,
      financialProgress,
      scheduledDate,
      contractor,
    });
  }

  return projects;
}

async function findExistingProject(title: string) {
  const projects = await prisma.officialProject.findMany({
    select: {
      id: true,
      projectCode: true,
      title: true,
    },
  });

  let bestMatch:
    | {
        id: string;
        projectCode: string;
        title: string;
        score: number;
      }
    | null = null;

  for (const project of projects) {
    const score = similarity(title, project.title);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        ...project,
        score,
      };
    }
  }

  /*
   * 0.82 is intentionally high.
   *
   * Government project titles can describe multiple schemes,
   * different road sections, or similar works. A lower threshold
   * would risk putting financial/project data on the wrong record.
   */
  if (bestMatch && bestMatch.score >= 0.82) {
    return bestMatch;
  }

  return null;
}

async function main() {
  console.log("Fetching official Jharkhand RCD report...");
  console.log(RCD_REPORT_URL);

  const response = await fetch(RCD_REPORT_URL, {
    headers: {
      "User-Agent": "InfraBuild/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `RCD request failed: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();

  const projects = extractRanchiProjects(html);

  console.log(
    `Found ${projects.length} Ranchi RCD project records.`
  );

  if (projects.length === 0) {
    console.log(
      "No Ranchi records were parsed. The government document format may have changed."
    );

    return;
  }

  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const project of projects) {
    const existing = await findExistingProject(project.title);

    if (existing) {
      await prisma.officialProject.update({
        where: {
          id: existing.id,
        },
        data: {
          assetType: project.assetType,

          amount:
            project.amount !== null
              ? project.amount
              : undefined,

          agreementAmount:
            project.agreementAmount !== null
              ? project.agreementAmount
              : undefined,

          physicalProgress:
            project.physicalProgress !== null
              ? project.physicalProgress
              : undefined,

          financialProgress:
            project.financialProgress !== null
              ? project.financialProgress
              : undefined,

          scheduledDate:
            project.scheduledDate !== null
              ? project.scheduledDate
              : undefined,

          contractor:
            project.contractor !== null
              ? project.contractor
              : undefined,

          department: "Jharkhand Road Construction Department",

          source: "Jharkhand Road Construction Department",

          sourceUrl: RCD_REPORT_URL,
        },
      });

      updated++;

      console.log(
        `UPDATED (${existing.score.toFixed(2)}): ${existing.title}`
      );

      continue;
    }

    /*
     * No confident match.
     *
     * Create a separate official record instead of attaching
     * government data to an unrelated RMC tender.
     */
    const existingRcd = await prisma.officialProject.findUnique({
      where: {
        projectCode_title: {
          projectCode: project.projectCode,
          title: project.title,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingRcd) {
      skipped++;

      console.log(
        `ALREADY EXISTS: ${project.projectCode} - ${project.title}`
      );

      continue;
    }

    await prisma.officialProject.create({
      data: {
        projectCode: project.projectCode,
        title: project.title,

        assetType: project.assetType,

        projectDate: project.projectDate,

        amount: project.amount,
        agreementAmount: project.agreementAmount,

        physicalProgress: project.physicalProgress,
        financialProgress: project.financialProgress,

        scheduledDate: project.scheduledDate,

        contractor: project.contractor,

        department:
          "Jharkhand Road Construction Department",

        source:
          "Jharkhand Road Construction Department",

        sourceUrl: RCD_REPORT_URL,

        matchedAssetId: null,
      },
    });

    created++;

    console.log(
      `CREATED: ${project.projectCode} - ${project.title}`
    );
  }

  console.log("");
  console.log("RCD enrichment complete.");
  console.log(`Updated existing projects: ${updated}`);
  console.log(`Created new RCD projects:   ${created}`);
  console.log(`Skipped existing records:   ${skipped}`);
}

main()
  .catch((error) => {
    console.error("RCD import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });