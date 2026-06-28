import { NextResponse, type NextRequest } from "next/server";
import { fetchExploreResults } from "@/features/explore/results";

/** Serves one validated explore result. Example: `GET /api/explore?type_in=data-story`. */
export async function GET(request: NextRequest) {
  try {
    const results = await fetchExploreResults(request.nextUrl.searchParams);

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "explore_results_failed",
        query: request.nextUrl.search,
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      { error: "Não foi possível carregar os resultados de exploração." },
      { status: 502 },
    );
  }
}
