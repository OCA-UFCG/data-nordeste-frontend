import { NextResponse, type NextRequest } from "next/server";
import {
  buildReportFileName,
  REPORT_ARTIFACT_HEADER,
} from "@/features/reports/automaticReport";
import {
  buildAutomaticReportGenerationUrl,
  findAvailableAutomaticReport,
} from "@/features/reports/reportGateway";

/** Starts generation and, when the backend names the artifact, answers ready. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const generationUrl = buildAutomaticReportGenerationUrl(
      request.nextUrl.searchParams,
    );
    const response = await fetch(generationUrl, { cache: "no-store" });
    if (!response.ok) return await buildUpstreamErrorResponse(response);

    // The backend generates synchronously, so by now the artifact is on disk and
    // this header names it. Resolving it here skips the polling loop entirely and
    // removes both guesses it depended on: the newest file matching the macrotheme
    // slug as a substring, and a mtime newer than the click — which a cache HIT
    // never produces, because it serves the PDF without rewriting it.
    const artifactName = response.headers.get(REPORT_ARTIFACT_HEADER);
    const report = artifactName
      ? await findAvailableAutomaticReport(
          request.nextUrl.searchParams,
          artifactName,
        )
      : null;
    if (report) return buildReadyResponse(request, report.fileName);

    // Backend without the header, or artifact not listed yet: the browser keeps
    // polling GET below, exactly as before.
    return NextResponse.json({ status: "processing" }, { status: 202 });
  } catch (error) {
    return buildGenerationFailure(request, error);
  }
}

/** Checks once for a generated PDF. The browser owns the retry interval. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // The poller never knows the artifact name yet (POST already returned before
    // one was known), so this falls to the city+macrotheme branch of
    // findAvailableAutomaticReport — no freshness gate. Task 7 closes that gap.
    const report = await findAvailableAutomaticReport(
      request.nextUrl.searchParams,
    );
    if (!report) {
      return NextResponse.json({ status: "processing" }, { status: 202 });
    }

    return buildReadyResponse(request, null);
  } catch (error) {
    return buildGenerationFailure(request, error);
  }
}

/** Ready payload pointing at the same-origin download route. */
function buildReadyResponse(
  request: NextRequest,
  artifactName: string | null,
): NextResponse {
  const downloadUrl = new URL("/api/reports/download", request.nextUrl);
  downloadUrl.search = request.nextUrl.search;

  // Appended as text instead of via searchParams.set: re-serializing the query
  // would re-encode the city the caller already encoded ("Recife%20(PE)" becomes
  // "Recife+%28PE%29"), and these URLs are compared verbatim.
  const separator = downloadUrl.search ? "&" : "?";
  const search = artifactName
    ? `${downloadUrl.search}${separator}arquivo=${encodeURIComponent(artifactName)}`
    : downloadUrl.search;

  return NextResponse.json({
    status: "ready",
    fileName: buildReportFileName(
      request.nextUrl.searchParams.get("city") ?? "",
    ),
    url: `${downloadUrl.pathname}${search}`,
  });
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
    { error: "Não foi possível gerar o relatório personalizado." },
    { status },
  );
}

function isReportValidationError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("Invalid ");
}
