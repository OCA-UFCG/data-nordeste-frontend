import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const API_URL = "http://automatic-report.test";

class AutomaticReportPlacesFetchFake {
  constructor(
    private readonly statesResponse: () => Response,
    private readonly areasResponse: () => Response = () =>
      Response.json(["Caatinga", "Semiárido"]),
  ) {}

  readonly fetch = vi.fn(async (url: string) => {
    if (url.endsWith("/estados")) return this.statesResponse();
    if (url.endsWith("/areas")) return this.areasResponse();

    return Response.json(["Recife (PE)", "São Luís (MA)"]);
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("automatic report cities proxy", () => {
  it("returns the states, the areas and the cities apart, from the API URL configured by the deployment", async () => {
    const automaticReportApi = new AutomaticReportPlacesFetchFake(() =>
      Response.json(["Maranhão", "Paraíba"]),
    );
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      states: ["Maranhão", "Paraíba"],
      areas: ["Caatinga", "Semiárido"],
      cities: ["Recife (PE)", "São Luís (MA)"],
    });
    expect(automaticReportApi.fetch).toHaveBeenCalledWith(`${API_URL}/cities`, {
      cache: "no-store",
    });
    expect(automaticReportApi.fetch).toHaveBeenCalledWith(
      `${API_URL}/estados`,
      { cache: "no-store" },
    );
    expect(automaticReportApi.fetch).toHaveBeenCalledWith(`${API_URL}/areas`, {
      cache: "no-store",
    });
  });

  it("keeps the municipal search working when the backend has no /estados nor /areas yet", async () => {
    const naoEncontrado = () => new Response("Not Found", { status: 404 });
    const automaticReportApi = new AutomaticReportPlacesFetchFake(
      naoEncontrado,
      naoEncontrado,
    );
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      states: [],
      areas: [],
      cities: ["Recife (PE)", "São Luís (MA)"],
    });
  });

  it("does not exist in prod while the report feature is off", async () => {
    const automaticReportApi = new AutomaticReportCitiesFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "prod");

    const response = await GET();

    expect(response.status).toBe(404);
    expect(automaticReportApi.fetch).not.toHaveBeenCalled();
  });
});
