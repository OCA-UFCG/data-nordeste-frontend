import { NextResponse, type NextRequest } from "next/server";
import {
  getAutomaticReportApiBaseUrl,
  parseAutomaticReportSlug,
} from "@/features/reports/automaticReport";

/** Proxies Automatic-Reporting generation. Example: `GET /api/reports/generate?city=Recife%20(PE)&macrotema=demografia`. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const generationUrl = buildGenerationUrl(request.nextUrl.searchParams);
    const response = await fetch(generationUrl, { cache: "no-store" });
    if (!response.ok) return await buildUpstreamErrorResponse(response);

    const report = await findGeneratedReport(request.nextUrl.searchParams);
    const pdfResponse = await fetch(report.pdfUrl, { cache: "no-store" });

    return await buildPdfResponse(pdfResponse, report.fileName);
  } catch (error) {
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
}

function buildGenerationUrl(params: URLSearchParams): string {
  const city = params.get("city")?.trim();
  if (!city) {
    throw new Error('Invalid city ""; expected a non-empty municipality name.');
  }

  const macrotheme = parseAutomaticReportSlug(params.get("macrotema"));
  const url = new URL(
    `/relatorio/${encodeURIComponent(city)}`,
    getAutomaticReportApiBaseUrl(),
  );
  url.searchParams.set("macrotema", macrotheme);

  return url.toString();
}

type AutomaticReportEntry = {
  arquivo_pdf: string;
  cidade: string;
  macrotema: string;
  pdf_url: string;
};

type GeneratedReport = {
  fileName: string;
  pdfUrl: string;
};

// PERF: Polling config — the Automatic-Reporting service generates the PDF
// asynchronously, so the report index may not list it immediately after the
// POST trigger. These values trade a little latency for reliability.
const REPORT_POLL_INTERVAL_MS = 1000;
const REPORT_POLL_MAX_ATTEMPTS = 5;

async function findGeneratedReport(
  params: URLSearchParams,
): Promise<GeneratedReport> {
  const macrotheme = parseAutomaticReportSlug(params.get("macrotema"));
  const city = params.get("city") ?? "";

  // INTENTIONAL: The POST to /relatorio/{city} kicks off asynchronous PDF
  // generation on the Automatic-Reporting service. Polling the report index
  // gives the backend time to publish the new entry before we give up.
  for (let attempt = 0; attempt < REPORT_POLL_MAX_ATTEMPTS; attempt++) {
    const reports = await fetchReportIndex();
    const candidates = reports.filter((entry) =>
      matchesGeneratedMacrotheme(entry, macrotheme),
    );
    const report = findCityReport(candidates, city);
    if (report) {
      return {
        fileName: report.arquivo_pdf,
        pdfUrl: new URL(
          report.pdf_url,
          getAutomaticReportApiBaseUrl(),
        ).toString(),
      };
    }

    if (attempt < REPORT_POLL_MAX_ATTEMPTS - 1) {
      await sleep(REPORT_POLL_INTERVAL_MS);
    }
  }

  throw new Error(
    `Generated report for macrotheme "${macrotheme}" and city "${city}" was not listed after ${REPORT_POLL_MAX_ATTEMPTS} attempts; expected an entry with a PDF URL.`,
  );
}

async function fetchReportIndex(): Promise<AutomaticReportEntry[]> {
  const reportsResponse = await fetch(
    `${getAutomaticReportApiBaseUrl()}/relatorios`,
    { cache: "no-store" },
  );
  if (!reportsResponse.ok) {
    throw new Error(
      `Automatic report index returned ${reportsResponse.status}; expected 200.`,
    );
  }

  return (await reportsResponse.json()) as AutomaticReportEntry[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesGeneratedMacrotheme(
  entry: AutomaticReportEntry,
  macrotheme: string,
): boolean {
  const normalizedEntry = normalizeReportLabel(entry.arquivo_pdf);
  const normalizedMacrotheme = normalizeReportLabel(macrotheme);

  return (
    Boolean(entry.pdf_url) && normalizedEntry.includes(normalizedMacrotheme)
  );
}

function findCityReport(
  reports: AutomaticReportEntry[],
  city: string,
): AutomaticReportEntry | undefined {
  const normalizedCity = normalizeReportLabel(city);

  return reports.find(
    (entry) => normalizeReportLabel(entry.cidade) === normalizedCity,
  );
}

function normalizeReportLabel(value: string): string {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

async function buildPdfResponse(
  response: Response,
  fileName: string,
): Promise<NextResponse> {
  if (!response.ok) return await buildUpstreamErrorResponse(response);

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Content-Type": "application/pdf",
    },
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

function isReportValidationError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith("Invalid ");
}
