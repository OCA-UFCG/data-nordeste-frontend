import { NextResponse, type NextRequest } from "next/server";
import {
  buildReportFileName,
  REPORT_ARTIFACT_HEADER,
  REPORT_VERSION_HEADER,
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

    // The backend answers 200 only once the artifact is on disk and these
    // headers name it, so the client can download without polling at all —
    // no need to resolve it against the backend index first (download/route.ts
    // still does that before it streams, so a bad name fails there instead).
    const arquivo = response.headers.get(REPORT_ARTIFACT_HEADER);
    const versao = response.headers.get(REPORT_VERSION_HEADER);

    // Backend without the header (deploy skew: new portal, old backend): the
    // browser keeps polling GET below rather than trusting a download URL
    // nothing can resolve.
    if (!arquivo) {
      return NextResponse.json({ status: "processing" }, { status: 202 });
    }

    return buildGenerationReadyResponse(request, arquivo, versao);
  } catch (error) {
    return buildGenerationFailure(request, error);
  }
}

/** Ready payload for POST, carrying the artifact's identity for task 7's gate. */
function buildGenerationReadyResponse(
  request: NextRequest,
  arquivo: string,
  versao: string | null,
): NextResponse {
  return NextResponse.json({
    status: "ready",
    arquivo,
    versao,
    fileName: buildReportFileName(
      request.nextUrl.searchParams.get("city") ?? "",
    ),
    url: buildDownloadUrl(request, arquivo),
  });
}

/** Checks once for a generated PDF. The browser owns the retry interval. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // `arquivo`/`versao_obsoleta` let a poller that already knows the name pin
    // the match by identity instead of city+macrotheme. Today's poller never
    // sends them (POST already returned before a name was known), so this
    // still falls to the city+macrotheme branch, no freshness gate. Task 7
    // wires the client to send them.
    const report = await findAvailableAutomaticReport(
      request.nextUrl.searchParams,
      request.nextUrl.searchParams.get("arquivo"),
      request.nextUrl.searchParams.get("versao_obsoleta"),
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
  return NextResponse.json({
    status: "ready",
    fileName: buildReportFileName(
      request.nextUrl.searchParams.get("city") ?? "",
    ),
    url: buildDownloadUrl(request, artifactName),
  });
}

/** Builds the same-origin download URL, forwarding the original query. */
function buildDownloadUrl(
  request: NextRequest,
  artifactName: string | null,
): string {
  const downloadUrl = new URL("/api/reports/download", request.nextUrl);
  downloadUrl.search = request.nextUrl.search;

  // Appended as text instead of via searchParams.set: re-serializing the query
  // would re-encode the city the caller already encoded ("Recife%20(PE)" becomes
  // "Recife+%28PE%29"), and these URLs are compared verbatim.
  const separator = downloadUrl.search ? "&" : "?";
  const search = artifactName
    ? `${downloadUrl.search}${separator}arquivo=${encodeURIComponent(artifactName)}`
    : downloadUrl.search;

  return `${downloadUrl.pathname}${search}`;
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
