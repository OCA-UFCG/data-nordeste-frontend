import { buildReportProxyUrl } from "@/features/reports/automaticReport";

export type AutomaticReportPreview = {
  fileName: string;
  url: string;
};

const REPORT_STATUS_INTERVAL_MS = 2000;
const REPORT_STATUS_MAX_ATTEMPTS = 60;

/** Asks the proxy for a report and returns it once ready. Example: `await requestReportPreview({ city, macrotheme })`. */
export async function requestReportPreview(request: {
  city: string;
  macrotheme: string;
}): Promise<AutomaticReportPreview> {
  // The freshness cursor is still sent for a backend that cannot name the
  // artifact it served; when the POST below resolves, the name settles which
  // report this is and the cursor plays no part.
  const geradoApos = new Date().toISOString();
  const generationUrl = buildReportProxyUrl({ ...request, geradoApos });
  const startResponse = await fetch(generationUrl, { method: "POST" });
  if (!startResponse.ok) throw new Error(`status ${startResponse.status}`);

  // Generation is synchronous upstream: when the proxy answers "ready" the
  // artifact already exists and there is nothing to wait for. Polling here is
  // what hung on a cache HIT, whose PDF is served without being rewritten and so
  // never looks newer than the click that asked for it.
  const started = await readReadyReport(startResponse);
  if (started) return started;

  for (let attempt = 0; attempt < REPORT_STATUS_MAX_ATTEMPTS; attempt++) {
    const response = await fetch(generationUrl, { cache: "no-store" });
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
  if (!response.ok) throw new Error(`status ${response.status}`);

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
