import { NextResponse, type NextRequest } from "next/server";
import { findAvailableAutomaticReport } from "@/features/reports/reportGateway";

/** Streams a ready report through the same origin used by pdf.js. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const report = await findAvailableAutomaticReport(
      request.nextUrl.searchParams,
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
        "Content-Disposition": `inline; filename="${report.fileName}"`,
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
      { error: "Não foi possível baixar o relatório automático." },
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
