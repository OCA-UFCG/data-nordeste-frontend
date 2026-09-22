import { NextResponse, type NextRequest } from "next/server";
import { buildReportFileName } from "@/features/reports/automaticReport";
import { findAvailableAutomaticReport } from "@/features/reports/reportGateway";

/** Streams a ready report through the same origin used by pdf.js. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // `arquivo` carries the exact name the generation route got from the backend.
    // The name is only ever resolved against the backend index, so it cannot point
    // anywhere else. Without it we fall back to matching by city + macrotheme.
    // `versao_obsoleta` rejects a match while its version is still the one marked
    // stale — see findAvailableAutomaticReport.
    const artifactName = request.nextUrl.searchParams.get("arquivo");
    const staleVersion = request.nextUrl.searchParams.get("versao_obsoleta");
    const report = await findAvailableAutomaticReport(
      request.nextUrl.searchParams,
      artifactName,
      staleVersion,
    );
    if (!report) {
      return NextResponse.json(
        { error: "O relatório ainda não está disponível." },
        { status: 404 },
      );
    }

    const response = await fetch(report.pdfUrl, { cache: "no-store" });
    if (!response.ok) return await buildDownloadError(response);

    return new NextResponse(response.body, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `inline; filename="${buildReportFileName(
          request.nextUrl.searchParams.get("city") ?? "",
        )}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "automatic_report_download_failed",
        query: request.nextUrl.search,
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return NextResponse.json(
      { error: "Não foi possível baixar o relatório personalizado." },
      { status: 502 },
    );
  }
}

async function buildDownloadError(response: Response): Promise<NextResponse> {
  return NextResponse.json(
    { error: "O backend não disponibilizou o arquivo PDF." },
    { status: response.status },
  );
}
