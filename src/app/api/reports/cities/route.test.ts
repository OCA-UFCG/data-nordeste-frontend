import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const API_URL = "http://automatic-report.test";

class AutomaticReportCitiesFetchFake {
  readonly fetch = vi.fn(async () =>
    Response.json(["Recife (PE)", "São Luís (MA)"]),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("automatic report cities proxy", () => {
  it("loads cities using the API URL configured by the deployment", async () => {
    const automaticReportApi = new AutomaticReportCitiesFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(["Recife (PE)", "São Luís (MA)"]);
    expect(automaticReportApi.fetch).toHaveBeenCalledWith(`${API_URL}/cities`, {
      cache: "no-store",
    });
  });
});
