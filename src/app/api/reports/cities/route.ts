import { NextResponse } from "next/server";
import { getAutomaticReportApiBaseUrl } from "@/features/reports/automaticReport";

/** Proxies Automatic-Reporting cities. Example: `GET /api/reports/cities`. */
export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(`${getAutomaticReportApiBaseUrl()}/cities`, {
      cache: "no-store",
    });

    return await buildCitiesResponse(response);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "automatic_report_cities_failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      { error: "Não foi possível carregar os municípios." },
      { status: 502 },
    );
  }
}

async function buildCitiesResponse(response: Response): Promise<NextResponse> {
  if (!response.ok) {
    return NextResponse.json(
      { error: "Não foi possível carregar os municípios." },
      { status: response.status },
    );
  }

  const cities = (await response.json()) as string[];

  return NextResponse.json(Array.isArray(cities) ? cities : []);
}
