import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateLifecycleRisk } from "@/lib/risk";

const departmentMap = {
  ROAD: "Road Department",
  BRIDGE: "Bridge / Engineering Department",
  DRAINAGE: "Drainage Department",
  STREETLIGHT: "Electrical / Streetlight Department",
} as const;

type AssetType = keyof typeof departmentMap;

const EARTH_RADIUS_METERS = 6_371_000;
const MATCH_RADIUS_METERS = 100;

function distanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRadians = (value: number) =>
    (value * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
}

function generateReportCode() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `RPT-${timestamp}-${random}`;
}

function generateAssetCode(type: AssetType) {
  const prefix = {
    ROAD: "RD",
    BRIDGE: "BR",
    DRAINAGE: "DR",
    STREETLIGHT: "SL",
  }[type];

  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const random = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
}

function parseYear(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const year =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isInteger(year)) {
    return null;
  }

  return year;
}

/* =========================================================
   GET REPORTS
   Used by Dashboard / Settings / Reports pages
   ========================================================= */

export async function GET(request: Request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const requestedLimit = Number(
      searchParams.get("limit") ?? "200"
    );

    const limit =
      Number.isFinite(requestedLimit) &&
      requestedLimit > 0
        ? Math.min(
            Math.floor(requestedLimit),
            500
          )
        : 200;

    const reports =
      await prisma.report.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: limit,

        include: {
          asset: {
            select: {
              id: true,
              assetCode: true,
              name: true,
              type: true,

              riskScore: true,
              riskLevel: true,

              installationYear: true,
              expectedMaintenanceYear: true,
              currentYear: true,
              ageYears: true,

              totalReports: true,
            },
          },
        },
      });

    return NextResponse.json({
      reports,
      total: reports.length,
    });
  } catch (error) {
    console.error(
      "GET /api/reports error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load reports.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   CREATE REPORT
   ========================================================= */

export async function POST(request: Request) {
  try {
    const session =
      await getServerSession(authOptions);

    const body = await request.json();

    const {
      title,
      description,
      type,
      latitude,
      longitude,
      address,
      imageUrl,
      installationYear:
        rawInstallationYear,
      expectedMaintenanceYear:
        rawExpectedMaintenanceYear,
      currentYear:
        rawCurrentYear,
    } = body;

    /* -----------------------------------------
       Basic validation
       ----------------------------------------- */

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Title and description are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "ROAD",
        "BRIDGE",
        "DRAINAGE",
        "STREETLIGHT",
      ].includes(type)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid infrastructure type.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        {
          error:
            "Valid latitude and longitude are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error:
            "Latitude or longitude is outside the valid range.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       Lifecycle years
       ----------------------------------------- */

    const installationYear =
      parseYear(rawInstallationYear);

    const expectedMaintenanceYear =
      parseYear(
        rawExpectedMaintenanceYear
      );

    const currentYear =
      parseYear(rawCurrentYear) ??
      new Date().getFullYear();

    if (installationYear === null) {
      return NextResponse.json(
        {
          error:
            "Installation year is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      expectedMaintenanceYear === null
    ) {
      return NextResponse.json(
        {
          error:
            "Expected maintenance year is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      installationYear < 1900 ||
      installationYear > currentYear
    ) {
      return NextResponse.json(
        {
          error:
            "Installation year must be between 1900 and the current year.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      expectedMaintenanceYear <
      installationYear
    ) {
      return NextResponse.json(
        {
          error:
            "Expected maintenance year cannot be earlier than the installation year.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      currentYear < 1900 ||
      currentYear > 2100
    ) {
      return NextResponse.json(
        {
          error: "Invalid current year.",
        },
        {
          status: 400,
        }
      );
    }

    const assetType = type as AssetType;

    const department =
      departmentMap[assetType];

    /* -----------------------------------------
       Find nearby existing assets
       ----------------------------------------- */

    const nearbyCandidates =
      await prisma.infrastructureAsset.findMany(
        {
          where: {
            type: assetType,
          },

          select: {
            id: true,
            assetCode: true,
            name: true,
            type: true,

            latitude: true,
            longitude: true,

            installationYear: true,
            expectedMaintenanceYear: true,
            currentYear: true,

            totalReports: true,
          },
        }
      );

    let nearestAsset:
      | (typeof nearbyCandidates)[number]
      | null = null;

    let nearestDistance =
      Number.POSITIVE_INFINITY;

    for (const asset of nearbyCandidates) {
      const distance =
        distanceInMeters(
          latitude,
          longitude,
          asset.latitude,
          asset.longitude
        );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAsset = asset;
      }
    }

    const matchedExistingAsset =
      nearestAsset &&
      nearestDistance <= MATCH_RADIUS_METERS
        ? nearestAsset
        : null;

    const reportCode =
      generateReportCode();

    /* -----------------------------------------
       Database transaction
       ----------------------------------------- */

    const result =
      await prisma.$transaction(
        async (tx) => {
          let asset;

          /* -----------------------------------
             Existing asset
             ----------------------------------- */

          if (matchedExistingAsset) {
            const effectiveInstallationYear =
              matchedExistingAsset.installationYear ??
              installationYear;

            const effectiveMaintenanceYear =
              matchedExistingAsset.expectedMaintenanceYear ??
              expectedMaintenanceYear;

            const effectiveCurrentYear =
              currentYear;

            const risk =
              calculateLifecycleRisk({
                installationYear:
                  effectiveInstallationYear,

                expectedMaintenanceYear:
                  effectiveMaintenanceYear,

                currentYear:
                  effectiveCurrentYear,
              });

            asset =
              await tx.infrastructureAsset.update(
                {
                  where: {
                    id: matchedExistingAsset.id,
                  },

                  data: {
                    installationYear:
                      effectiveInstallationYear,

                    expectedMaintenanceYear:
                      effectiveMaintenanceYear,

                    currentYear:
                      effectiveCurrentYear,

                    ageYears:
                      risk.ageYears,

                    riskScore:
                      risk.score,

                    riskLevel:
                      risk.level,

                    totalReports: {
                      increment: 1,
                    },
                  },
                }
              );

            const report =
              await tx.report.create({
                data: {
                  reportCode,

                  title: title.trim(),

                  description:
                    description.trim(),

                  type: assetType,

                  status: "OPEN",

                  source: "CITIZEN",

                  department,

                  latitude,

                  longitude,

                  address:
                    address?.trim() || null,

                  imageUrl:
                    imageUrl?.trim() || null,

                  installationYear:
                    effectiveInstallationYear,

                  expectedMaintenanceYear:
                    effectiveMaintenanceYear,

                  currentYear:
                    effectiveCurrentYear,

                  assetId: asset.id,

                  userId:
                    session?.user?.id ?? null,
                },

                include: {
                  asset: true,
                },
              });

            await tx.riskAnalysis.create({
              data: {
                assetId: asset.id,

                reportId: report.id,

                riskScore:
                  risk.score,

                riskLevel:
                  risk.level,

                explanation:
                  risk.explanation,

                model:
                  "LIFECYCLE_RULES",
              },
            });

            return {
              report,

              matchedExistingAsset: true,

              distanceToAsset:
                nearestDistance,

              risk,
            };
          }

          /* -----------------------------------
             New infrastructure asset
             ----------------------------------- */

          const risk =
            calculateLifecycleRisk({
              installationYear,

              expectedMaintenanceYear,

              currentYear,
            });

          asset =
            await tx.infrastructureAsset.create({
              data: {
                assetCode:
                  generateAssetCode(
                    assetType
                  ),

                name: title.trim(),

                type: assetType,

                description:
                  description.trim(),

                locationName:
                  address?.trim() || null,

                city: "Ranchi",

                district: "Ranchi",

                state: "Jharkhand",

                latitude,

                longitude,

                status: "REPORTED",

                installationYear,

                expectedMaintenanceYear,

                currentYear,

                ageYears:
                  risk.ageYears,

                riskScore:
                  risk.score,

                riskLevel:
                  risk.level,

                totalReports: 1,
              },
            });

          const report =
            await tx.report.create({
              data: {
                reportCode,

                title: title.trim(),

                description:
                  description.trim(),

                type: assetType,

                status: "OPEN",

                source: "CITIZEN",

                department,

                latitude,

                longitude,

                address:
                  address?.trim() || null,

                imageUrl:
                  imageUrl?.trim() || null,

                installationYear,

                expectedMaintenanceYear,

                currentYear,

                assetId: asset.id,

                userId:
                  session?.user?.id ?? null,
              },

              include: {
                asset: true,
              },
            });

          await tx.riskAnalysis.create({
            data: {
              assetId: asset.id,

              reportId: report.id,

              riskScore:
                risk.score,

              riskLevel:
                risk.level,

              explanation:
                risk.explanation,

              model:
                "LIFECYCLE_RULES",
            },
          });

          return {
            report,

            matchedExistingAsset: false,

            distanceToAsset: null,

            risk,
          };
        }
      );

    /* -----------------------------------------
       Response
       ----------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        ...result,

        message:
          result.matchedExistingAsset
            ? "Report attached to the existing infrastructure asset."
            : "Report created a new infrastructure asset.",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Create report error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create report.",
      },
      {
        status: 500,
      }
    );
  }
}