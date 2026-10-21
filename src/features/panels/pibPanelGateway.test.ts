import { describe, expect, it, vi } from "vitest";
import { fetchPibPanel, hasMobilePibPanel } from "./pibPanelGateway";

const API_URL = "http://automatic-report.test";

const PANEL_PAYLOAD = {
  fonte: "IBGE",
  anos: [2023],
  ufs: ["PB"],
  registros: [],
};

class PibPanelFetchFake {
  constructor(private readonly response: Response) {}

  readonly fetch = vi.fn(async (): Promise<Response> => this.response);
}

describe("hasMobilePibPanel", () => {
  it("matches the PIB panel id regardless of case", () => {
    expect(hasMobilePibPanel("PIB")).toBe(true);
    expect(hasMobilePibPanel("ipca")).toBe(false);
  });
});

describe("fetchPibPanel", () => {
  it("requests /paineis/pib with the revalidate window", async () => {
    const backend = new PibPanelFetchFake(Response.json(PANEL_PAYLOAD));

    const panel = await fetchPibPanel({
      getBaseUrl: () => API_URL,
      fetcher: backend.fetch,
      revalidate: 3600,
    });

    expect(panel?.years).toEqual([2023]);
    expect(backend.fetch).toHaveBeenCalledWith(`${API_URL}/paineis/pib`, {
      next: { revalidate: 3600 },
    });
  });

  it("returns null and logs when the backend answers 503", async () => {
    const backend = new PibPanelFetchFake(new Response(null, { status: 503 }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const panel = await fetchPibPanel({
      getBaseUrl: () => API_URL,
      fetcher: backend.fetch,
      revalidate: 60,
    });

    expect(panel).toBeNull();
    expect(log.mock.calls[0][0]).toContain('"event":"pib_panel_fetch_failed"');
    expect(log.mock.calls[0][0]).toContain("status 503");
  });

  it("returns null instead of throwing when the API URL is not configured", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const panel = await fetchPibPanel({
      getBaseUrl: () => {
        throw new Error("Invalid AUTOMATIC_REPORT_API_URL");
      },
      revalidate: 60,
    });

    expect(panel).toBeNull();
  });
});
