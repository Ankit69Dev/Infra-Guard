import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const body = await request.json().catch(() => null);

    const reason =
      typeof body?.reason === "string"
        ? body.reason.trim()
        : "";

    const deletionDate =
      typeof body?.deletionDate === "string"
        ? new Date(body.deletionDate)
        : new Date();

    // Validate reason
    if (!reason) {
      return NextResponse.json(
        {
          error:
            "A reason for deleting the report is required.",
        },
        { status: 400 }
      );
    }

    if (reason.length < 3) {
      return NextResponse.json(
        {
          error:
            "Please provide a meaningful reason for deleting the report.",
        },
        { status: 400 }
      );
    }

    // Validate deletion date
    if (Number.isNaN(deletionDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid deletion date.",
        },
        { status: 400 }
      );
    }

    // Find report
    const report = await prisma.report.findUnique({
      where: {
        id,
      },
      include: {
        asset: {
          select: {
            id: true,
            totalReports: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          error: "Report not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Everything is performed inside one transaction.
     *
     * 1. Save deletion audit information.
     * 2. Delete RiskAnalysis records belonging to report.
     * 3. Decrease linked asset report count.
     * 4. Permanently delete the report.
     */
    await prisma.$transaction(async (tx) => {
      // Keep deletion history
      await tx.reportDeletion.create({
        data: {
          reportCode: report.reportCode,
          title: report.title,
          reason,
          deletedAt: deletionDate,
        },
      });

      // RiskAnalysis does not cascade from Report,
      // so delete these records first.
      await tx.riskAnalysis.deleteMany({
        where: {
          reportId: report.id,
        },
      });

      // Keep the infrastructure asset.
      // Only decrease its report count.
      if (report.asset) {
        await tx.infrastructureAsset.update({
          where: {
            id: report.asset.id,
          },
          data: {
            totalReports: Math.max(
              0,
              report.asset.totalReports - 1
            ),
          },
        });
      }

      // Permanently delete the report.
      await tx.report.delete({
        where: {
          id: report.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Report deleted successfully.",
      reportCode: report.reportCode,
      deletedAt: deletionDate.toISOString(),
    });
  } catch (error) {
    console.error(
      "DELETE /api/reports/[id] error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete report.",
      },
      { status: 500 }
    );
  }
}