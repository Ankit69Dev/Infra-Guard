import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  "openai/gpt-oss-120b";

/**
 * GET
 *
 * Loads a report using its human-facing reportCode.
 *
 * Example:
 * /api/ai-insights?reportCode=RPT-MUVMBU5U-BZMWB
 */
export async function GET(request: NextRequest) {
  try {
    const reportCode =
      request.nextUrl.searchParams
        .get("reportCode")
        ?.trim();

    if (!reportCode) {
      return NextResponse.json(
        {
          error: "Report code is required.",
        },
        {
          status: 400,
        }
      );
    }

    const report =
      await prisma.report.findUnique({
        where: {
          reportCode,
        },

        include: {
          asset: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              type: true,
              description: true,

              locationName: true,
              city: true,
              district: true,
              state: true,

              latitude: true,
              longitude: true,

              status: true,

              installationYear: true,
              expectedMaintenanceYear: true,
              currentYear: true,
              ageYears: true,

              conditionScore: true,

              riskScore: true,
              riskLevel: true,

              totalReports: true,
            },
          },

          riskAnalyses: {
            orderBy: {
              analyzedAt: "desc",
            },

            take: 5,

            select: {
              riskScore: true,
              riskLevel: true,
              explanation: true,
              model: true,
              analyzedAt: true,
            },
          },
        },
      });

    if (!report) {
      return NextResponse.json(
        {
          error: `Report ${reportCode} was not found.`,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      report: {
        id: report.id,
        reportCode: report.reportCode,

        title: report.title,
        description: report.description,

        type: String(report.type),
        status: String(report.status),
        source: String(report.source),

        department: report.department,

        latitude: report.latitude,
        longitude: report.longitude,

        address: report.address,

        createdAt: report.createdAt,

        installationYear:
          report.installationYear,

        expectedMaintenanceYear:
          report.expectedMaintenanceYear,

        currentYear:
          report.currentYear,

        asset: report.asset,

        riskAnalyses:
          report.riskAnalyses,
      },
    });
  } catch (error) {
    console.error(
      "AI Insights GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load report.",
      },
      {
        status: 500,
      }
    );
  }
}

/**
 * POST
 *
 * Ask Groq a question about one report.
 *
 * Body:
 * {
 *   reportCode: string,
 *   message: string
 * }
 */
export async function POST(
  request: NextRequest
) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY is not configured in .env.local.",
        },
        {
          status: 500,
        }
      );
    }

    const body =
      await request.json();

    const reportCode = String(
      body.reportCode ?? ""
    ).trim();

    const reportId = String(
      body.reportId ?? ""
    ).trim();

    const message = String(
      body.message ?? ""
    ).trim();

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!reportCode && !reportId) {
      return NextResponse.json(
        {
          error:
            "Report code or report ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Prefer the human-facing reportCode.
     * Keep reportId support as a fallback.
     */
    const report = reportCode
      ? await prisma.report.findUnique(
          {
            where: {
              reportCode,
            },

            include: {
              asset: {
                include: {
                  maintenanceRecords: {
                    orderBy: {
                      performedAt:
                        "desc",
                    },

                    take: 10,
                  },

                  riskAnalyses: {
                    orderBy: {
                      analyzedAt:
                        "desc",
                    },

                    take: 5,
                  },
                },
              },

              riskAnalyses: {
                orderBy: {
                  analyzedAt:
                    "desc",
                },

                take: 5,
              },
            },
          }
        )
      : await prisma.report.findUnique(
          {
            where: {
              id: reportId,
            },

            include: {
              asset: {
                include: {
                  maintenanceRecords: {
                    orderBy: {
                      performedAt:
                        "desc",
                    },

                    take: 10,
                  },

                  riskAnalyses: {
                    orderBy: {
                      analyzedAt:
                        "desc",
                    },

                    take: 5,
                  },
                },
              },

              riskAnalyses: {
                orderBy: {
                  analyzedAt:
                    "desc",
                },

                take: 5,
              },
            },
          }
        );

    if (!report) {
      return NextResponse.json(
        {
          error:
            "The requested report was not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Build a controlled database context.
     *
     * Only information from the database is
     * passed to the AI.
     */
    const reportContext = {
      report: {
        id: report.id,

        reportCode:
          report.reportCode,

        title:
          report.title,

        description:
          report.description,

        type:
          String(report.type),

        status:
          String(report.status),

        source:
          String(report.source),

        department:
          report.department,

        latitude:
          report.latitude,

        longitude:
          report.longitude,

        address:
          report.address,

        createdAt:
          report.createdAt,

        installationYear:
          report.installationYear,

        expectedMaintenanceYear:
          report.expectedMaintenanceYear,

        currentYear:
          report.currentYear,
      },

      asset: report.asset
        ? {
            id:
              report.asset.id,

            assetCode:
              report.asset.assetCode,

            name:
              report.asset.name,

            type:
              String(
                report.asset.type
              ),

            description:
              report.asset.description,

            locationName:
              report.asset.locationName,

            city:
              report.asset.city,

            district:
              report.asset.district,

            state:
              report.asset.state,

            latitude:
              report.asset.latitude,

            longitude:
              report.asset.longitude,

            status:
              report.asset.status,

            installationYear:
              report.asset
                .installationYear,

            expectedMaintenanceYear:
              report.asset
                .expectedMaintenanceYear,

            currentYear:
              report.asset.currentYear,

            ageYears:
              report.asset.ageYears,

            conditionScore:
              report.asset.conditionScore,

            riskScore:
              report.asset.riskScore,

            riskLevel:
              report.asset.riskLevel
                ? String(
                    report.asset
                      .riskLevel
                  )
                : null,

            totalReports:
              report.asset.totalReports,

            maintenanceRecords:
              report.asset.maintenanceRecords.map(
                (record) => ({
                  maintenanceType:
                    record.maintenanceType,

                  description:
                    record.description,

                  performedAt:
                    record.performedAt,

                  completedAt:
                    record.completedAt,

                  status:
                    record.status,

                  contractor:
                    record.contractor,

                  cost:
                    record.cost,
                })
              ),

            riskAnalyses:
              report.asset.riskAnalyses.map(
                (analysis) => ({
                  riskScore:
                    analysis.riskScore,

                  riskLevel:
                    String(
                      analysis.riskLevel
                    ),

                  explanation:
                    analysis.explanation,

                  model:
                    analysis.model,

                  analyzedAt:
                    analysis.analyzedAt,
                })
              ),
          }
        : null,

      reportRiskAnalyses:
        report.riskAnalyses.map(
          (analysis) => ({
            riskScore:
              analysis.riskScore,

            riskLevel:
              String(
                analysis.riskLevel
              ),

            explanation:
              analysis.explanation,

            model:
              analysis.model,

            analyzedAt:
              analysis.analyzedAt,
          })
        ),
    };

    /*
     * Send the report context to Groq.
     */
    const completion =
      await groq.chat.completions.create(
        {
          model: GROQ_MODEL,

          temperature: 0.2,

          max_tokens: 1000,

          messages: [
            {
  role: "system",

  content: `
You are Infra Guard AI, an infrastructure issue analysis assistant.

Your job is to explain ONE infrastructure report using the supplied database context.

IMPORTANT:

The database and deterministic lifecycle risk engine are the source of truth.

The official risk score and risk level must NEVER be changed by AI.

Do NOT calculate a new official risk score.

Do NOT invent facts.

Do NOT claim that a field inspection has happened.

Do NOT invent maintenance records.

Do NOT invent dates, costs, contractors, locations, measurements, road conditions, accident history, traffic volume, or inspection results.

If information is not present in the database, say:
"That information is not available in the database."

You may provide recommendations, but clearly label them as recommendations.

Do not present recommendations or assumptions as database facts.

For example:

BAD:
"The pothole is causing vehicle damage."

GOOD:
"A field inspection is recommended to determine whether the pothole presents a vehicle-safety concern."

Keep answers concise and easy to read.

Do NOT use Markdown tables.

Do NOT start with "Facts from the database".

Do NOT dump the entire database context back to the user.

Do NOT repeat every field unless it directly helps answer the question.

Use short sections when useful.

Preferred response structure:

**Risk: CRITICAL — 80%**

Short explanation of why the asset has this risk based strictly on:
- installation year
- expected maintenance year
- current year
- asset age
- maintenance history

**What the data shows**
- Important database fact
- Important database fact
- Important database fact

**Recommended action**
1. Practical recommendation
2. Practical recommendation
3. Practical recommendation

**Important:** The official lifecycle risk remains 80% (CRITICAL). AI does not change the official risk score.

For different questions, adapt the structure naturally.

If the user asks why the risk is high, explain the lifecycle inputs.

If the user asks for a summary, provide a short summary.

If the user asks about maintenance, discuss only the maintenance records supplied.

If there are no maintenance records, explicitly say that no maintenance records are available.

If the user asks what should happen next, provide practical inspection or maintenance recommendations.

Always distinguish:
- DATABASE FACTS
- AI RECOMMENDATIONS

Never claim that recommendations are confirmed actions.

The current official risk comes from the deterministic lifecycle risk engine.
  `.trim(),
},

            {
  role: "user",

  content: `
Here is the database context for the selected infrastructure report:

${JSON.stringify(
  reportContext,
  null,
  2
)}

Answer the user's question using only this context.

User question:

${message}

Remember:
- Do not invent facts.
- Do not use a Markdown table.
- Keep the answer concise.
- Separate database facts from recommendations.
- Never change the official risk score.
  `.trim(),

            },
          ],
        }
      );

    const answer =
      completion.choices[0]
        ?.message?.content
        ?.trim() ||
      "I could not generate an answer for this report.";

    return NextResponse.json({
      answer,

      model:
        GROQ_MODEL,

      report: {
        id:
          report.id,

        reportCode:
          report.reportCode,

        title:
          report.title,

        riskScore:
          report.asset
            ?.riskScore ??
          null,

        riskLevel:
          report.asset
            ?.riskLevel
            ? String(
                report.asset
                  .riskLevel
              )
            : null,
      },
    });
  } catch (error) {
    console.error(
      "AI Insights POST error:",
      error
    );

    let message =
      "Failed to generate AI response.";

    if (
      error instanceof Error
    ) {
      message =
        error.message;
    }

    /*
     * Give a cleaner error when
     * Groq rejects the model.
     */
    if (
      message.includes(
        "model_not_found"
      ) ||
      message.includes(
        "does not exist"
      )
    ) {
      message =
        `Groq model "${GROQ_MODEL}" is unavailable. ` +
        `Set GROQ_MODEL="openai/gpt-oss-120b" in .env.local and restart the server.`;
    }

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}