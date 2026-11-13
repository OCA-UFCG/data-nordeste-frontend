import { isReportFeatureEnabled } from "@/features/reports/availability";
import { NextResponse } from "next/server";
import { getAutomaticReportApiBaseUrl } from "@/features/reports/automaticReport";
import type { ReportPlaces } from "@/features/reports/reportPlaces";

/**
 * Proxies the places a report can be generated for: the Northeast states from
 * Automatic-Reporting `/estados`, the areas of interest from `/areas` and the
 * municipalities from `/cities`, kept apart so the search can cap
 * municipalities without hiding any state or area.
 * Example: `GET /api/reports/cities` → `{ states: ["Paraíba", …], areas: ["Caatinga", …], cities: ["Recife (PE)", …] }`.
 */
export async function GET(): Promise<NextResponse> {
  if (!isReportFeatureEnabled()) return new NextResponse(null, { status: 404 });

  try {
    const apiBaseUrl = getAutomaticReportApiBaseUrl();
    const [citiesResponse, states, areas] = await Promise.all([
      fetch(`${apiBaseUrl}/cities`, { cache: "no-store" }),
      fetchOptionalPlaceList(apiBaseUrl, "/estados", "states"),
      fetchOptionalPlaceList(apiBaseUrl, "/areas", "areas"),
    ]);

    return await buildCitiesResponse(citiesResponse, states, areas);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "automatic_report_cities_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      { error: "Não foi possível carregar os municípios e estados." },
      { status: 502 },
    );
  }
}

async function buildCitiesResponse(
  response: Response,
  states: string[],
  areas: string[],
): Promise<NextResponse> {
  if (!response.ok) {
    return NextResponse.json(
      { error: "Não foi possível carregar os municípios e estados." },
      { status: response.status },
    );
  }

  const cities = (await response.json()) as unknown;
  const places: ReportPlaces = {
    states,
    areas,
    cities: Array.isArray(cities) ? cities.map(String) : [],
  };

  return NextResponse.json(places);
}

// INTENTIONAL: states and areas are optional. A backend deployed before
// `/estados` or `/areas` existed answers 404 here, and the municipal search must
// keep working, so any failure becomes an empty list plus a log line instead of
// a 502 for the whole search.
// Example: `await fetchOptionalPlaceList(apiBaseUrl, "/areas", "areas")` → `["Caatinga", …]`.
async function fetchOptionalPlaceList(
  apiBaseUrl: string,
  path: "/estados" | "/areas",
  kind: "states" | "areas",
): Promise<string[]> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(
        `Automatic report ${kind} returned ${response.status}; expected 200 with a JSON array of names.`,
      );
    }
    const names = (await response.json()) as unknown;

    return Array.isArray(names) ? names.map(String) : [];
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: `automatic_report_${kind}_unavailable`,
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return [];
  }
}
