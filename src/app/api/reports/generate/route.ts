import { NextResponse, type NextRequest } from "next/server";
import { buildReportFileName } from "@/features/reports/automaticReport";
import {
  buildAutomaticReportGenerationUrl,
  findAvailableAutomaticReport,
} from "@/features/reports/reportGateway";

/** Starts generation without holding the browser connection open. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const generationUrl = buildAutomaticReportGenerationUrl(
      request.nextUrl.searchParams,
    );
    const response = await fetch(generationUrl, { cache: "no-store" });
    if (!response.ok) return await buildUpstreamErrorResponse(response);

    return NextResponse.json({ status: "processing" }, { status: 202 });
  } catch (error) {
    return buildGenerationFailure(request, error);
  }
}

/** Checks once for a generated PDF. The browser owns the retry interval. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const report = await findAvailableAutomaticReport(
      request.nextUrl.searchParams,
      request.nextUrl.searchParams.get("gerado_apos"),
    );
    if (!report) {
      return NextResponse.json({ status: "processing" }, { status: 202 });
    }

    const downloadUrl = new URL("/api/reports/download", request.nextUrl);
    downloadUrl.search = request.nextUrl.search;

    return NextResponse.json({
      status: "ready",
      fileName: buildReportFileName(
        request.nextUrl.searchParams.get("city") ?? "",
      ),
      url: `${downloadUrl.pathname}${downloadUrl.search}`,
    });
  } catch (error) {
    return buildGenerationFailure(request, error);
  }
}

async function buildUpstreamErrorResponse(
  response: Response,
): Promise<NextResponse> {
  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "text/plain",
    },
  });
}

function buildGenerationFailure(
  request: NextRequest,
  error: unknown,
): NextResponse {
  const status = isReportValidationError(error) ? 400 : 502;
  console.error(
    JSON.stringify({
      event: "automatic_report_generation_failed",
      query: request.nextUrl.search,
      error: error instanceof Error ? error.message : String(error),
    }),
  );

  return NextResponse.json(
    { error: "Não foi possível gerar o relatório automático." },
    { status },
  );
}

function isReportValidationError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("Invalid ");
}
