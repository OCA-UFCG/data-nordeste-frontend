import { NextRequest, NextResponse } from "next/server";
import { CONTENT_REVALIDATE_SECONDS } from "@/config/revalidation";
import { fetchPibPanel } from "@/features/panels/pibPanelGateway";
import { parsePibSelection } from "@/features/panels/pibSelection";
import { getAutomaticReportApiBaseUrl } from "@/features/reports/automaticReport";

/**
 * Proxies one PIB panel selection to Automatic-Reporting, which the browser
 * cannot reach directly. Example: `GET /api/paineis/pib?area=ne&uf=PB`.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  let selection;

  try {
    selection = parsePibSelection(request.nextUrl.searchParams);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 422 },
    );
  }

  const panel = await fetchPibPanel({
    getBaseUrl: getAutomaticReportApiBaseUrl,
    revalidate: CONTENT_REVALIDATE_SECONDS,
    selection,
  });

  if (!panel) {
    return NextResponse.json(
      { error: "Não foi possível carregar os dados do painel de PIB." },
      { status: 502 },
    );
  }

  return NextResponse.json(panel);
}
