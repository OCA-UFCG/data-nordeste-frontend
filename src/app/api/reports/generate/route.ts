import { NextResponse, type NextRequest } from "next/server";
import {
  buildReportFileName,
  REPORT_ARTIFACT_HEADER,
  REPORT_STALE_VERSION_HEADER,
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
    if (response.status === 503) return buildBusyResponse(response);
    if (!response.ok) return await buildUpstreamErrorResponse(response);

    // 202 must be branched on before any ready-path header read below: those
    // same header names read as "ready" would point the client at whatever
    // stale PDF already sits on disk under this artifact name — the failure
    // `aguardar=nao` exists to avoid. `versaoObsoleta` (not `versao`) is what
    // requestReportPreview forwards as `versao_obsoleta` on the next poll.
    if (response.status === 202) return buildProcessingResponse(response);

    // The backend answers 200 only once the artifact is on disk and these
    // headers name it, so the client can download without polling at all —
    // no need to resolve it against the backend index first (download/route.ts
    // still does that before it streams, so a bad name fails there instead).
    const arquivo = response.headers.get(REPORT_ARTIFACT_HEADER);
    const versao = response.headers.get(REPORT_VERSION_HEADER);

    // Backend without the header (deploy skew: new portal, old backend): this
    // does NOT degrade to polling — GET has no more city+macrotheme fallback,
    // so the poll it triggers (arquivo-less) fails fast with 400 on its very
    // first attempt instead of ever finding the artifact. An explicit error
    // beats masking deploy skew as an infinite spinner; normal deploy order
    // (backend ships before portal) means this path should not be reached.
    if (!arquivo) {
      return NextResponse.json({ status: "processing" }, { status: 202 });
    }

    return buildGenerationReadyResponse(request, arquivo, versao);
  } catch (error) {
    return buildGenerationFailure(request, error);
  }
}

/** Too many generations already in flight: fail fast instead of queueing past the portal's own budget. */
function buildBusyResponse(response: Response): NextResponse {
  return NextResponse.json(
    {
      error:
        "O gerador de relatórios está ocupado. Tente novamente em instantes.",
    },
    {
      status: 503,
      headers: { "Retry-After": response.headers.get("Retry-After") ?? "30" },
    },
  );
}

/** Processing payload for POST when the backend accepted the job at 202 (`aguardar=nao`). */
function buildProcessingResponse(response: Response): NextResponse {
  return NextResponse.json(
    {
      status: "processing",
      arquivo: response.headers.get(REPORT_ARTIFACT_HEADER),
      versaoObsoleta: response.headers.get(REPORT_STALE_VERSION_HEADER),
    },
    { status: 202 },
  );
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
    // The poller sends the artifact name and version the POST resolved, so the
    // match is by identity rather than by city+macrotheme: a missing `arquivo`
    // is a caller that skipped the POST step, not a legacy fallback to honor.
    const report = await findAvailableAutomaticReport(
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
