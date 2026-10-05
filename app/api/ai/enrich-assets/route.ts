import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

const MODEL = "openai/gpt-oss-20b";

// IMPORTANT:
// Only ONE asset per button/API request.
// This prevents accidental bulk Groq usage.
const ASSETS_PER_RUN = 1;

// Keep generated answer very small.
const MAX_COMPLETION_TOKENS = 250;

// Only enrich infrastructure where public information
// is reasonably likely to exist.
const PRIORITY_TYPES = new Set([
  "BRIDGE",
  "ROAD",
  "DRAINAGE",
  "WATERWAY",
]);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function cleanJson(text: string): string {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function getRetryAfterSeconds(error: any): number | null {
  try {
    const value =
      error?.headers?.get?.("retry-after");

    if (!value) {
      return null;
    }

    const seconds = Number(value);

    return Number.isFinite(seconds)
      ? seconds
      : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------
// POST
// ------------------------------------------------------------

export async function POST() {
  try {
    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // --------------------------------------------------------
    // ENVIRONMENT
    // --------------------------------------------------------

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error:
            "GROQ_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------------
    // FIND CANDIDATES
    // --------------------------------------------------------
    //
    // IMPORTANT:
    // We do NOT load thousands of assets.
    //
    // We only load a small number of candidates and
    // choose priority infrastructure locally.
    // --------------------------------------------------------

    const candidates =
      await prisma.infrastructureAsset.findMany({
        where: {
          enrichmentUpdatedAt: null,
        },

        orderBy: [
          {
            createdAt: "asc",
          },
        ],

        take: 30,

        select: {
          id: true,
          assetCode: true,
          name: true,
          type: true,
          locationName: true,
          latitude: true,
          longitude: true,
        },
      });

    // --------------------------------------------------------
    // PRIORITY FILTER
    // --------------------------------------------------------

    const priorityAssets =
      candidates.filter((asset) =>
        PRIORITY_TYPES.has(
          String(asset.type).toUpperCase()
        )
      );

    // If there are no priority assets in this batch,
    // don't waste an AI request.
    if (priorityAssets.length === 0) {
      return NextResponse.json({
        success: true,
        enriched: 0,
        processed: 0,
        message:
          "No priority infrastructure requires AI enrichment.",
      });
    }

    // ONLY ONE ASSET.
    const asset =
      priorityAssets[0];

    // --------------------------------------------------------
    // SMALL PROMPT
    // --------------------------------------------------------
    //
    // Do NOT send the complete Prisma record.
    //
    // No complaints.
    // No inspections.
    // No maintenance records.
    // No risk calculations.
    // No environmental data.
    // --------------------------------------------------------

    const prompt = `
Research this Ranchi infrastructure asset.

Return ONLY JSON:

{
  "verified": true,
  "summary": "max 40 words",
  "construction_year": null,
  "maintenance_information": null,
  "project_information": null,
  "source_urls": []
}

Rules:
- Search public sources.
- Prefer government or official project sources.
- Never guess.
- Never invent facts.
- Do not estimate age.
- Do not estimate condition.
- Do not estimate risk.
- Do not invent complaints.
- Do not invent maintenance.
- Use null when information is unavailable.
- Maximum 2 source URLs.

Asset:
${asset.name || "Unnamed"}
Type: ${String(asset.type)}
Location: ${asset.locationName || "Ranchi, Jharkhand"}
Coordinates: ${asset.latitude}, ${asset.longitude}
`;

    console.log(
      `AI enrichment: ${asset.assetCode}`
    );

    // --------------------------------------------------------
    // GROQ
    // --------------------------------------------------------

    let response;

    try {
      response =
        await groq.chat.completions.create({
          model: MODEL,

          messages: [
            {
              role: "system",
              content:
                "You are a concise factual infrastructure researcher. Never fabricate information.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          // Don't make the model creative.
          temperature: 0,

          // VERY IMPORTANT.
          // GPT-OSS supports controllable reasoning.
          reasoning_effort: "low",

          // HARD LIMIT ON GENERATED OUTPUT.
          max_completion_tokens:
            MAX_COMPLETION_TOKENS,

          // Browser search is used ONLY for this
          // single important infrastructure asset.
          tools: [
            {
              type: "browser_search",
            },
          ],

          tool_choice: "required",
        });
    } catch (error: any) {
      const status =
        error?.status ??
        error?.statusCode;

      // ------------------------------------------------------
      // 429
      // ------------------------------------------------------

      if (status === 429) {
        const retryAfterSeconds =
          getRetryAfterSeconds(error);

        console.warn(
          "Groq daily/token rate limit reached."
        );

        return NextResponse.json(
          {
            success: false,

            error:
              "Groq token limit reached.",

            message:
              "No asset was changed. Wait for the Groq quota to reset before trying again.",

            retryAfterSeconds,

            assetCode:
              asset.assetCode,
          },
          {
            status: 429,

            headers:
              retryAfterSeconds !== null
                ? {
                    "Retry-After":
                      String(
                        retryAfterSeconds
                      ),
                  }
                : undefined,
          }
        );
      }

      console.error(
        "Groq API error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Groq AI request failed.",
          assetCode:
            asset.assetCode,
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------------
    // GET MODEL RESPONSE
    // --------------------------------------------------------

    const content =
      response.choices?.[0]?.message
        ?.content;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Groq returned an empty response.",
          assetCode:
            asset.assetCode,
        },
        {
          status: 502,
        }
      );
    }

    // --------------------------------------------------------
    // PARSE JSON
    // --------------------------------------------------------

    let data: {
      verified?: boolean;
      summary?: string | null;
      construction_year?: number | null;
      maintenance_information?:
        | string
        | null;
      project_information?:
        | string
        | null;
      source_urls?: unknown;
    };

    try {
      data = JSON.parse(
        cleanJson(content)
      );
    } catch (error) {
      console.error(
        "Groq returned invalid JSON:",
        content
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "AI returned invalid JSON.",
          assetCode:
            asset.assetCode,
        },
        {
          status: 502,
        }
      );
    }

    // --------------------------------------------------------
    // VERIFY SOURCES
    // --------------------------------------------------------

    const sourceUrls =
      Array.isArray(
        data.source_urls
      )
        ? data.source_urls
            .filter(isValidUrl)
            .slice(0, 2)
        : [];

    // Never save an AI answer that doesn't have
    // a verifiable source.
    if (
      data.verified !== true ||
      sourceUrls.length === 0
    ) {
      return NextResponse.json({
        success: false,
        enriched: false,
        assetCode:
          asset.assetCode,
        message:
          "No sufficiently verified public information was found. Asset was not changed.",
      });
    }

    // --------------------------------------------------------
    // CLEAN SUMMARY
    // --------------------------------------------------------

    const summary =
      typeof data.summary === "string"
        ? data.summary
            .trim()
            .slice(0, 500)
        : null;

    // --------------------------------------------------------
    // DATABASE UPDATE
    // --------------------------------------------------------
    //
    // IMPORTANT:
    //
    // We ONLY update enrichment fields.
    //
    // We DO NOT modify:
    // conditionScore
    // riskScore
    // complaints
    // maintenance records
    // traffic
    // criticality
    // failure probability
    //
    // This prevents AI from corrupting your real data.
    // --------------------------------------------------------

    await prisma.infrastructureAsset.update({
      where: {
        id: asset.id,
      },

      data: {
        enrichmentSummary:
          summary ||
          "Verified public information found.",

        enrichmentSource:
          sourceUrls.join("\n"),

        enrichmentUpdatedAt:
          new Date(),
      },
    });

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return NextResponse.json({
      success: true,

      enriched: 1,

      processed: 1,

      asset: {
        id: asset.id,
        assetCode:
          asset.assetCode,
        name: asset.name,
        type: String(
          asset.type
        ),
      },

      summary,

      sources: sourceUrls,

      message:
        "One priority asset was successfully enriched.",
    });
  } catch (error) {
    console.error(
      "Asset enrichment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Asset enrichment failed.",
      },
      {
        status: 500,
      }
    );
  }
}