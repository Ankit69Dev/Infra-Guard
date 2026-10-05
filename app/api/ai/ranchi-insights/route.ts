import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const assets = await prisma.infrastructureAsset.findMany({
      select: {
        id: true,
        assetCode: true,
        name: true,
        type: true,
        lat: true,
        long: true,
        locationName: true,
        conditionScore: true,
        riskScore: true,
        ageYears: true,
        trafficLevel: true,
        criticality: true,
      },
    });

    const totalAssets = assets.length;

    const typeCounts = assets.reduce(
      (acc, asset) => {
        const type = String(asset.type);

        acc[type] = (acc[type] || 0) + 1;

        return acc;
      },
      {} as Record<string, number>
    );

    const scoredAssets = assets.filter(
      (asset) =>
        typeof asset.riskScore === "number"
    );

    const criticalAssets = assets.filter(
      (asset) =>
        typeof asset.riskScore === "number" &&
        asset.riskScore >= 80
    );

    const highRiskAssets = assets.filter(
      (asset) =>
        typeof asset.riskScore === "number" &&
        asset.riskScore >= 60 &&
        asset.riskScore < 80
    );

    const conditionValues = assets
      .map((asset) => asset.conditionScore)
      .filter(
        (value): value is number =>
          typeof value === "number" &&
          Number.isFinite(value)
      );

    const averageCondition =
      conditionValues.length > 0
        ? Math.round(
            conditionValues.reduce(
              (sum, value) => sum + value,
              0
            ) / conditionValues.length
          )
        : null;

    const riskValues = assets
      .map((asset) => asset.riskScore)
      .filter(
        (value): value is number =>
          typeof value === "number" &&
          Number.isFinite(value)
      );

    const averageRisk =
      riskValues.length > 0
        ? Math.round(
            riskValues.reduce(
              (sum, value) => sum + value,
              0
            ) / riskValues.length
          )
        : null;

    const infrastructureData = {
      city: "Ranchi",
      state: "Jharkhand",

      totalAssets,

      assetTypes: typeCounts,

      riskCoverage: {
        assetsWithRiskScore: scoredAssets.length,
        assetsWithoutRiskScore:
          totalAssets - scoredAssets.length,
        critical: criticalAssets.length,
        high: highRiskAssets.length,
        averageRisk,
      },

      condition: {
        assetsWithConditionScore:
          conditionValues.length,
        averageCondition,
      },

      sampleAssets: assets
        .slice(0, 50)
        .map((asset) => ({
          assetCode: asset.assetCode,
          name: asset.name,
          type: String(asset.type),
          location: asset.locationName,
          conditionScore: asset.conditionScore,
          riskScore: asset.riskScore,
          ageYears: asset.ageYears,
          trafficLevel: asset.trafficLevel,
          criticality: asset.criticality,
        })),
    };

    const ranchiContext = `
RANCHI INFRASTRUCTURE CONTEXT

Location:
Ranchi, Jharkhand, India.

Municipal infrastructure:
Ranchi Municipal Corporation is responsible for civic infrastructure
including roads, bridges, drains, culverts, stormwater drainage,
public amenities and sanitation-related infrastructure.

Engineering priorities:
Road construction, road widening/resurfacing and drainage
improvement are important municipal engineering activities.

Environmental context:
Ranchi experiences a strong monsoon season. Heavy rainfall and
stormwater management are therefore relevant when evaluating
drainage, roads, culverts and waterlogging-related infrastructure risk.

Important limitation:
OpenStreetMap provides infrastructure inventory and geographic
attributes, but does NOT provide verified structural condition,
failure history or maintenance history.

Therefore:
NEVER invent a condition score, failure probability, complaint
count, maintenance history or risk score.

If the database does not contain enough information for a numerical
risk prediction, explicitly say that more field/maintenance data is
required.
`;

    const prompt = `
You are the AI infrastructure analyst for "Infra Build",
a predictive maintenance platform for Ranchi, Jharkhand.

Your job is to analyze the REAL infrastructure inventory supplied
by the database and explain what a municipal engineering team should
prioritize.

${ranchiContext}

DATABASE DATA:

${JSON.stringify(infrastructureData, null, 2)}

Produce a practical engineering intelligence report.

Focus on:

1. Overall infrastructure situation
2. Most important infrastructure categories
3. Potential maintenance priorities
4. Data quality / missing information
5. Ranchi-specific environmental considerations
6. Recommended next actions
7. Whether the current data is sufficient for predictive risk scoring

IMPORTANT:
- Never fabricate measurements.
- Never fabricate complaints.
- Never fabricate failures.
- Never fabricate asset ages.
- Never create a risk score if one is not present.
- Distinguish database facts from engineering recommendations.
- Use concise language suitable for a government dashboard.
`;

    const completion =
      await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",

        temperature: 0.2,

        messages: [
          {
            role: "system",
            content:
              "You are a careful municipal infrastructure analyst. Use only the supplied evidence and clearly identify missing data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        response_format: {
          type: "json_schema",

          json_schema: {
            name: "ranchi_infrastructure_report",

            strict: true,

            schema: {
              type: "object",

              properties: {
                headline: {
                  type: "string",
                },

                overview: {
                  type: "string",
                },

                infrastructure_priorities: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                environmental_factors: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                data_gaps: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                recommended_actions: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },

                predictive_readiness: {
                  type: "string",
                  enum: [
                    "READY",
                    "PARTIALLY_READY",
                    "NOT_READY",
                  ],
                },

                predictive_readiness_reason: {
                  type: "string",
                },
              },

              required: [
                "headline",
                "overview",
                "infrastructure_priorities",
                "environmental_factors",
                "data_gaps",
                "recommended_actions",
                "predictive_readiness",
                "predictive_readiness_reason",
              ],

              additionalProperties: false,
            },
          },
        },
      });

    const content =
      completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Groq returned an empty response");
    }

    const report = JSON.parse(content);

    return NextResponse.json({
      success: true,
      report,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Ranchi AI error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate AI infrastructure insights.",
      },
      { status: 500 }
    );
  }
}