import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const assets =
    await prisma.infrastructureAsset.findMany({
      select: {
        assetCode: true,
        name: true,
        type: true,
        status: true,

        lat: true,
        long: true,

        locationName: true,
        city: true,
        district: true,

        conditionScore: true,
        riskScore: true,

        criticality: true,
      },

      orderBy: {
        assetCode: "asc",
      },
    });

  const totalAssets = assets.length;

  const assetsWithRisk = assets.filter(
    (asset) =>
      asset.riskScore !== null &&
      asset.riskScore !== undefined
  );

  const criticalAssets = assets.filter(
    (asset) =>
      asset.riskScore !== null &&
      asset.riskScore >= 75
  ).length;

  const highRiskAssets = assets.filter(
    (asset) =>
      asset.riskScore !== null &&
      asset.riskScore >= 50 &&
      asset.riskScore < 75
  ).length;

  const mediumRiskAssets = assets.filter(
    (asset) =>
      asset.riskScore !== null &&
      asset.riskScore >= 25 &&
      asset.riskScore < 50
  ).length;

  const lowRiskAssets = assets.filter(
    (asset) =>
      asset.riskScore !== null &&
      asset.riskScore < 25
  ).length;

  const averageRisk =
    assetsWithRisk.length > 0
      ? Math.round(
          assetsWithRisk.reduce(
            (sum, asset) =>
              sum + (asset.riskScore ?? 0),
            0
          ) / assetsWithRisk.length
        )
      : null;

  const averageCondition =
    assets.filter(
      (asset) =>
        asset.conditionScore !== null &&
        asset.conditionScore !== undefined
    );

  const conditionScore =
    averageCondition.length > 0
      ? Math.round(
          averageCondition.reduce(
            (sum, asset) =>
              sum +
              (asset.conditionScore ?? 0),
            0
          ) / averageCondition.length
        )
      : null;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),

    location: {
      city: "Ranchi",
      district: "Ranchi",
      state: "Jharkhand",
    },

    totals: {
      assets: totalAssets,

      critical:
        assetsWithRisk.length > 0
          ? criticalAssets
          : null,

      highRisk:
        assetsWithRisk.length > 0
          ? highRiskAssets
          : null,

      mediumRisk:
        assetsWithRisk.length > 0
          ? mediumRiskAssets
          : null,

      lowRisk:
        assetsWithRisk.length > 0
          ? lowRiskAssets
          : null,
    },

    health: {
      conditionScore,
      averageRisk,
    },

    riskDataAvailable:
      assetsWithRisk.length > 0,

    assets: assets.map((asset) => ({
      id: asset.assetCode,

      name: asset.name,

      type: asset.type,

      status: asset.status,

      latitude: asset.lat,
      longitude: asset.long,

      location:
        asset.locationName ??
        asset.city ??
        "Ranchi",

      district: asset.district,

      riskScore: asset.riskScore,

      conditionScore:
        asset.conditionScore,

      criticality:
        asset.criticality,
    })),
  });
}