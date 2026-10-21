import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PIB_PANEL_PAYLOAD } from "@/features/panels/pibPanelFixtures";
import { GET } from "./route";

const API_URL = "http://automatic-report.test";

class AutomaticReportPibFetchFake {
  readonly requested: string[] = [];

  constructor(private readonly response: Response) {}

  readonly fetch = vi.fn(async (input: string): Promise<Response> => {
    this.requested.push(input);

    return this.response;
  });
}

const request = (query: string) =>
  new NextRequest(`http://localhost/api/paineis/pib?${query}`);

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/paineis/pib", () => {
  it("forwards the selection and returns the panel model", async () => {
    const backend = new AutomaticReportPibFetchFake(
      Response.json(PIB_PANEL_PAYLOAD),
    );
    vi.stubGlobal("fetch", backend.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const response = await GET(request("area=ne&uf=PB"));

    expect(response.status).toBe(200);
    expect((await response.json()).selection).toEqual({
      area: "ne",
      uf: "PB",
      municipio: null,
    });
    expect(backend.requested).toEqual([`${API_URL}/paineis/pib?area=ne&uf=PB`]);
  });

  it("rejects a malformed filter before calling the backend", async () => {
    const backend = new AutomaticReportPibFetchFake(
      Response.json(PIB_PANEL_PAYLOAD),
    );
    vi.stubGlobal("fetch", backend.fetch);

    const response = await GET(request("uf=paraiba"));

    expect(response.status).toBe(422);
    expect(backend.requested).toEqual([]);
  });

  it("answers 502 when the backend is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      new AutomaticReportPibFetchFake(new Response(null, { status: 503 }))
        .fetch,
    );
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const response = await GET(request("area=ne"));

    expect(response.status).toBe(502);
  });
});
