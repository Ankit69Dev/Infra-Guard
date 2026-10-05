import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const assetId = request.nextUrl.searchParams.get("assetId");

    if (!assetId) {
      return NextResponse.json(
        {
          error: "assetId is required",
        },
        {
          status: 400,
        }
      );
    }

    const asset = await prisma.infrastructureAsset.findUnique({
      where: {
        id: assetId,
      },

      select: {
        id: true,
        assetCode: true,
        name: true,
        type: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        {
          error: "Infrastructure asset not found",
        },
        {
          status: 404,
        }
      );
    }

    const [maintenanceRecords, officialProjects] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where: {
          assetId,
        },

        orderBy: {
          performedAt: "desc",
        },
      }),

      prisma.officialProject.findMany({
        where: {
          matchedAssetId: assetId,
        },

        orderBy: [
          {
            projectDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),
    ]);

    return NextResponse.json({
      asset,
      maintenanceRecords,
      officialProjects,
    });
  } catch (error) {
    console.error("GET /api/maintenance error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch asset history",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      assetId,
      maintenanceType,
      description,
      performedAt,
      completedAt,
      status,
      contractor,
      cost,
      source,
      sourceUrl,
    } = body;

    if (!assetId) {
      return NextResponse.json(
        {
          error: "assetId is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!maintenanceType) {
      return NextResponse.json(
        {
          error: "maintenanceType is required",
        },
        {
          status: 400,
        }
      );
    }

    const asset = await prisma.infrastructureAsset.findUnique({
      where: {
        id: assetId,
      },

      select: {
        id: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        {
          error: "Infrastructure asset not found",
        },
        {
          status: 404,
        }
      );
    }

    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: {
        assetId,

        maintenanceType: String(maintenanceType).trim(),

        description:
          description !== undefined &&
          description !== null &&
          String(description).trim() !== ""
            ? String(description).trim()
            : null,

        performedAt: performedAt
          ? new Date(performedAt)
          : new Date(),

        completedAt: completedAt
          ? new Date(completedAt)
          : null,

        status:
          status !== undefined &&
          status !== null &&
          String(status).trim() !== ""
            ? String(status).trim()
            : null,

        contractor:
          contractor !== undefined &&
          contractor !== null &&
          String(contractor).trim() !== ""
            ? String(contractor).trim()
            : null,

        cost:
          cost !== undefined &&
          cost !== null &&
          cost !== ""
            ? Number(cost)
            : null,

        source:
          source !== undefined &&
          source !== null &&
          String(source).trim() !== ""
            ? String(source).trim()
            : null,

        sourceUrl:
          sourceUrl !== undefined &&
          sourceUrl !== null &&
          String(sourceUrl).trim() !== ""
            ? String(sourceUrl).trim()
            : null,
      },
    });

    return NextResponse.json(
      {
        maintenanceRecord,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/maintenance error:", error);

    return NextResponse.json(
      {
        error: "Failed to create maintenance record",
      },
      {
        status: 500,
      }
    );
  }
}