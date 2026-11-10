import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const API_URL = "http://automatic-report.test";

class AutomaticReportPlacesFetchFake {
  constructor(private readonly statesResponse: () => Response) {}

  readonly fetch = vi.fn(async (url: string) =>
    url.endsWith("/estados")
      ? this.statesResponse()
      : Response.json(["Recife (PE)", "São Luís (MA)"]),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("automatic report cities proxy", () => {
  it("returns the states and the cities apart, from the API URL configured by the deployment", async () => {
    const automaticReportApi = new AutomaticReportPlacesFetchFake(() =>
      Response.json(["Maranhão", "Paraíba"]),
    );
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      states: ["Maranhão", "Paraíba"],
      cities: ["Recife (PE)", "São Luís (MA)"],
    });
    expect(automaticReportApi.fetch).toHaveBeenCalledWith(`${API_URL}/cities`, {
      cache: "no-store",
    });
    expect(automaticReportApi.fetch).toHaveBeenCalledWith(
      `${API_URL}/estados`,
      { cache: "no-store" },
    );
  });

  it("keeps the municipal search working when the backend has no /estados yet", async () => {
    const automaticReportApi = new AutomaticReportPlacesFetchFake(
      () => new Response("Not Found", { status: 404 }),
    );
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      states: [],
      cities: ["Recife (PE)", "São Luís (MA)"],
    });
  });
});
