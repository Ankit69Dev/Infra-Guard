import { NextResponse } from "next/server";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const BBOX = {
  south: 23.25,
  west: 85.20,
  north: 23.50,
  east: 85.45,
};

type OSMElement = {
  type: "node" | "way" | "relation";
  id: number;

  lat?: number;
  lon?: number;

  center?: {
    lat: number;
    lon: number;
  };

  tags?: {
    name?: string;
    "name:en"?: string;
    place?: string;
  };
};

export async function GET() {
  const query = `
    [out:json][timeout:30];

    (
      node["place"]["name"](
        ${BBOX.south},
        ${BBOX.west},
        ${BBOX.north},
        ${BBOX.east}
      );

      way["place"]["name"](
        ${BBOX.south},
        ${BBOX.west},
        ${BBOX.north},
        ${BBOX.east}
      );

      relation["place"]["name"](
        ${BBOX.south},
        ${BBOX.west},
        ${BBOX.north},
        ${BBOX.east}
      );
    );

    out center;
  `;

  let lastError = "Unknown Overpass error";

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Trying Overpass endpoint: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          "User-Agent":
            "InfraGuard/1.0 (infrastructure reporting project)",
        },
        body: new URLSearchParams({
          data: query,
        }).toString(),
        cache: "no-store",
      });

      const responseText = await response.text();

      if (!response.ok) {
        lastError = `Overpass returned ${response.status}: ${responseText.slice(
          0,
          300
        )}`;

        console.error(lastError);

        continue;
      }

      let data: {
        elements?: OSMElement[];
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        lastError =
          "Overpass returned an invalid JSON response.";

        console.error(lastError);

        continue;
      }

      const elements = data.elements ?? [];

      const locations = elements
        .map((element) => {
          const latitude =
            element.lat ?? element.center?.lat;

          const longitude =
            element.lon ?? element.center?.lon;

          const name =
            element.tags?.["name:en"] ??
            element.tags?.name;

          if (
            !name ||
            latitude === undefined ||
            longitude === undefined
          ) {
            return null;
          }

          return {
            id: `${element.type}-${element.id}`,
            name: name.trim(),
            type: element.tags?.place ?? "place",
            latitude,
            longitude,
          };
        })
        .filter(
          (
            location
          ): location is {
            id: string;
            name: string;
            type: string;
            latitude: number;
            longitude: number;
          } => location !== null
        );

      /*
       * Remove duplicate names.
       */
      const uniqueLocations = Array.from(
        new Map(
          locations.map((location) => [
            location.name.toLowerCase(),
            location,
          ])
        ).values()
      ).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      console.log(
        `Loaded ${uniqueLocations.length} Ranchi locations from OSM`
      );

      return NextResponse.json({
        success: true,
        source: "OpenStreetMap",
        region: "Ranchi, Jharkhand, India",
        count: uniqueLocations.length,
        locations: uniqueLocations,
      });
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "Unknown network error";

      console.error(
        `Overpass endpoint failed: ${endpoint}`,
        error
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: "Unable to load Ranchi locations from OpenStreetMap.",
      details: lastError,
    },
    { status: 502 }
  );
}