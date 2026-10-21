import { describe, expect, it, vi } from "vitest";
import { fetchPibPanel, hasMobilePibPanel } from "./pibPanelGateway";
import { PIB_PANEL_PAYLOAD } from "./pibPanelFixtures";

const API_URL = "http://automatic-report.test";

class PibPanelFetchFake {
  constructor(private readonly response: Response) {}

  readonly requested: string[] = [];

  readonly fetch = vi.fn(
    async (input: string): Promise<Response> => this.respondTo(input),
  );

  private respondTo(input: string): Response {
    this.requested.push(input);

    return this.response;
  }
}

describe("hasMobilePibPanel", () => {
  it("matches the PIB panel id regardless of case", () => {
    expect(hasMobilePibPanel("PIB")).toBe(true);
    expect(hasMobilePibPanel("ipca")).toBe(false);
  });
});

describe("fetchPibPanel", () => {
  it("requests the default selection with the revalidate window", async () => {
    const backend = new PibPanelFetchFake(Response.json(PIB_PANEL_PAYLOAD));

    const panel = await fetchPibPanel({
      getBaseUrl: () => API_URL,
      fetcher: backend.fetch,
      revalidate: 3600,
    });

    expect(panel?.series).toHaveLength(3);
    expect(backend.fetch).toHaveBeenCalledWith(
      `${API_URL}/paineis/pib?area=aas_21`,
      { next: { revalidate: 3600 } },
    );
  });

  it("forwards the selection as query params", async () => {
    const backend = new PibPanelFetchFake(Response.json(PIB_PANEL_PAYLOAD));

    await fetchPibPanel({
      getBaseUrl: () => API_URL,
      fetcher: backend.fetch,
      revalidate: 60,
      selection: { area: "ne", uf: "PB", municipio: 2504009 },
    });

    expect(backend.requested[0]).toBe(
      `${API_URL}/paineis/pib?area=ne&uf=PB&municipio=2504009`,
    );
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
