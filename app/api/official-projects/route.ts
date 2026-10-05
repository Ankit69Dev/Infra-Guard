import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";
    const matched = searchParams.get("matched")?.trim() || "";

    const page = Math.max(
      Number.parseInt(searchParams.get("page") || "1", 10) || 1,
      1
    );

    const requestedPageSize =
      Number.parseInt(searchParams.get("pageSize") || "25", 10) || 25;

    const pageSize = Math.min(Math.max(requestedPageSize, 1), 100);

    const where = {
      ...(search
        ? {
            OR: [
              {
                projectCode: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                title: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                contractor: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(type
        ? {
            assetType: type as "ROAD" | "BRIDGE" | "DRAINAGE" | "STREETLIGHT",
          }
        : {}),

      ...(matched === "true"
        ? {
            matchedAssetId: {
              not: null,
            },
          }
        : matched === "false"
          ? {
              matchedAssetId: null,
            }
          : {}),
    };

    const [projects, total, matchedCount, unmatchedCount] =
      await Promise.all([
        prisma.officialProject.findMany({
          where,
          orderBy: [
            {
              projectDate: "desc",
            },
            {
              createdAt: "desc",
            },
          ],
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: {
            matchedAsset: {
              select: {
                id: true,
                assetCode: true,
                name: true,
                type: true,
                locationName: true,
              },
            },
          },
        }),

        prisma.officialProject.count({
          where,
        }),

        prisma.officialProject.count({
          where: {
            matchedAssetId: {
              not: null,
            },
          },
        }),

        prisma.officialProject.count({
          where: {
            matchedAssetId: null,
          },
        }),
      ]);

    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      summary: {
        totalProjects: await prisma.officialProject.count(),
        matchedProjects: matchedCount,
        unmatchedProjects: unmatchedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/official-projects error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch official projects",
      },
      {
        status: 500,
      }
    );
  }
}