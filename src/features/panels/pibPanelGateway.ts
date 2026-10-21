import { parsePibPanel, type PibPanel } from "@/features/panels/pibPanel";

// Contentful panel ids are titles (`title_in` in DATA_PANEL_QUERY), so the PIB
// panel lives at `/data-panel/pib`. Only this panel has a mobile version so far.
const PIB_PANEL_ID = "pib";

export type PibPanelFetcher = (
  input: string,
  init?: RequestInit & { next?: { revalidate: number } },
) => Promise<Response>;

// getBaseUrl is a getter, not a string: a missing env var throws inside the try
// in fetchPibPanel and degrades to the Power BI iframe instead of failing the page.
export type FetchPibPanelOptions = {
  getBaseUrl: () => string;
  fetcher?: PibPanelFetcher;
  revalidate: number;
};

/** True when the panel has a native mobile version. Example: `hasMobilePibPanel("PIB") === true`. */
export function hasMobilePibPanel(panelId: string): boolean {
  return panelId.toLowerCase() === PIB_PANEL_ID;
}

/**
 * Loads the PIB panel from Automatic-Reporting `GET /paineis/pib`.
 * Returns null on any failure so the page falls back to the Power BI iframe.
 * Example: `await fetchPibPanel({ getBaseUrl: () => "http://127.0.0.1:8000", revalidate: 3600 })`.
 */
export async function fetchPibPanel({
  getBaseUrl,
  fetcher = fetch,
  revalidate,
}: FetchPibPanelOptions): Promise<PibPanel | null> {
  let endpoint = "/paineis/pib";

  try {
    endpoint = `${getBaseUrl()}/paineis/pib`;
    const response = await fetcher(endpoint, { next: { revalidate } });

    return await readPibPanelResponse(endpoint, response);
  } catch (error) {
    logPibPanelFailure(endpoint, error);

    return null;
  }
}

async function readPibPanelResponse(
  endpoint: string,
  response: Response,
): Promise<PibPanel> {
  if (!response.ok) {
    throw new Error(
      `PIB panel request failed for endpoint "${endpoint}" with status ${response.status}; expected 200 with panel JSON.`,
    );
  }

  return parsePibPanel(await response.json());
}

function logPibPanelFailure(endpoint: string, error: unknown): void {
  console.error(
    JSON.stringify({
      event: "pib_panel_fetch_failed",
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
}
