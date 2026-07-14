import { NextResponse, type NextRequest } from "next/server";
import {
  getAutomaticReportApiBaseUrl,
  parseAutomaticReportSlug,
} from "@/features/reports/automaticReport";

/** Proxies Automatic-Reporting generation. Example: `GET /api/reports/generate?city=Recife%20(PE)&macrotema=demografia&macrotema=saude`. */
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

  const macrothemes = parseRequestedMacrothemes(params);
  const url = new URL(
    `/relatorio/${encodeURIComponent(city)}`,
    getAutomaticReportApiBaseUrl(),
  );
  macrothemes.forEach((macrotheme) =>
    url.searchParams.append("macrotema", macrotheme),
  );

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

async function findGeneratedReport(
  params: URLSearchParams,
): Promise<GeneratedReport> {
  const reportsResponse = await fetch(
    `${getAutomaticReportApiBaseUrl()}/relatorios`,
    { cache: "no-store" },
  );
  if (!reportsResponse.ok) {
    throw new Error(
      `Automatic report index returned ${reportsResponse.status}; expected 200.`,
    );
  }

  const reports = (await reportsResponse.json()) as AutomaticReportEntry[];
  const macrothemes = parseRequestedMacrothemes(params);
  const city = params.get("city") ?? "";
  const candidates = reports.filter((entry) =>
    matchesGeneratedMacrothemes(entry, macrothemes),
  );
  const report = findCityReport(candidates, city) ?? candidates[0];
  if (!report) {
    throw new Error(
      `Generated report for macrothemes "${macrothemes.join(",")}" was not listed; expected an entry with a PDF URL.`,
    );
  }

  return {
    fileName: report.arquivo_pdf,
    pdfUrl: new URL(report.pdf_url, getAutomaticReportApiBaseUrl()).toString(),
  };
}

function matchesGeneratedMacrothemes(
  entry: AutomaticReportEntry,
  macrothemes: string[],
): boolean {
  const normalizedEntry = normalizeReportLabel(entry.arquivo_pdf);

  return (
    Boolean(entry.pdf_url) &&
    macrothemes.every((macrotheme) =>
      normalizedEntry.includes(normalizeReportLabel(macrotheme)),
    )
  );
}

function parseRequestedMacrothemes(
  params: URLSearchParams,
): ReturnType<typeof parseAutomaticReportSlug>[] {
  const values = params.getAll("macrotema");
  if (values.length === 0) return [parseAutomaticReportSlug(null)];

  return [...new Set(values.map((value) => parseAutomaticReportSlug(value)))];
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
