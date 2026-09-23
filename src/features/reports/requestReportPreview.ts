import { buildReportProxyUrl } from "@/features/reports/automaticReport";
import { ReportBusyError } from "@/features/reports/reportBusyError";

export type AutomaticReportPreview = {
  fileName: string;
  url: string;
};

type ReportGenerationStart = {
  status: "ready" | "processing";
  arquivo?: string;
  versaoObsoleta?: string;
  fileName?: string;
  url?: string;
};

const REPORT_STATUS_INTERVAL_MS = 2000;
const REPORT_STATUS_MAX_ATTEMPTS = 60;

/** Asks the proxy for a report and returns it once ready. Example: `await requestReportPreview({ city, macrotheme })`. */
export async function requestReportPreview(request: {
  city: string;
  macrotheme: string;
}): Promise<AutomaticReportPreview> {
  const startResponse = await fetch(buildReportProxyUrl(request), {
    method: "POST",
  });
  if (startResponse.status === 503) throw new ReportBusyError();
  if (!startResponse.ok) throw new Error(`status ${startResponse.status}`);

  const started = (await startResponse.json()) as ReportGenerationStart;

  // Generation is synchronous upstream: when the POST already answers "ready"
  // the artifact exists now (cache HIT or fresh render) and there is nothing
  // to poll for.
  if (started.status === "ready" && started.fileName && started.url) {
    return { fileName: started.fileName, url: started.url };
  }

  // The artifact's own name and version — not the click's timestamp — decide
  // whether a later poll response is this request's report; see
  // findAvailableAutomaticReport for the match this feeds.
  const pollUrl = buildReportProxyUrl({
    ...request,
    arquivo: started.arquivo,
    versaoObsoleta: started.versaoObsoleta,
  });

  for (let attempt = 0; attempt < REPORT_STATUS_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(pollUrl, { cache: "no-store" });
    const preview = await readReadyReport(response);
    if (preview) return preview;
    await waitForReportStatus();
  }

  throw new Error(
    `Report for city "${request.city}" was not ready after ${REPORT_STATUS_MAX_ATTEMPTS} attempts; expected a PDF URL.`,
  );
}

async function readReadyReport(
  response: Response,
): Promise<AutomaticReportPreview | null> {
  if (response.status === 202) return null;
  if (!response.ok) {
    throw new Error(
      `Automatic report poll returned status ${response.status}; expected 200 with a ready report or 202 while still processing.`,
    );
  }

  const result = (await response.json()) as AutomaticReportPreview & {
    status: "ready";
  };

  return { fileName: result.fileName, url: result.url };
}

function waitForReportStatus(): Promise<void> {
  return new Promise((resolve) =>
    window.setTimeout(resolve, REPORT_STATUS_INTERVAL_MS),
  );
}
