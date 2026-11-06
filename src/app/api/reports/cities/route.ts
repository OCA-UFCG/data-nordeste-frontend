import { NextResponse } from "next/server";
import { getAutomaticReportApiBaseUrl } from "@/features/reports/automaticReport";

/**
 * Proxies the places a report can be generated for: the Northeast states from
 * Automatic-Reporting `/estados`, followed by its municipalities from `/cities`.
 * Example: `GET /api/reports/cities` → `["Paraíba", …, "Recife (PE)", …]`.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const apiBaseUrl = getAutomaticReportApiBaseUrl();
    const [citiesResponse, states] = await Promise.all([
      fetch(`${apiBaseUrl}/cities`, { cache: "no-store" }),
      fetchReportStates(apiBaseUrl),
    ]);

    return await buildCitiesResponse(citiesResponse, states);
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
): Promise<NextResponse> {
  if (!response.ok) {
    return NextResponse.json(
      { error: "Não foi possível carregar os municípios e estados." },
      { status: response.status },
    );
  }

  const cities = (await response.json()) as string[];

  // States first: there are only nine, and they are what an empty search shows.
  return NextResponse.json([
    ...states,
    ...(Array.isArray(cities) ? cities : []),
  ]);
}

// INTENTIONAL: states are optional. A backend deployed before `/estados` existed
// answers 404 here, and the municipal search must keep working, so any failure
// becomes an empty list plus a log line instead of a 502 for the whole search.
async function fetchReportStates(apiBaseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/estados`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(
        `Automatic report states returned ${response.status}; expected 200 with a JSON array of state names.`,
      );
    }
    const states = (await response.json()) as unknown;

    return Array.isArray(states) ? states.map(String) : [];
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "automatic_report_states_unavailable",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return [];
  }
}
