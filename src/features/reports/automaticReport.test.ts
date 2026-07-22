import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAutomaticReportUrl } from "./automaticReport";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("automatic report URL", () => {
  it("uses the production report route at the public origin", () => {
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", "");
    vi.spyOn(Date, "now").mockReturnValue(1_721_600_000_000);

    const url = buildAutomaticReportUrl({
      city: "São Luís (MA)",
      macrotheme: "saude",
    });

    expect(url).toBe(
      "/relatorio/S%C3%A3o%20Lu%C3%ADs%20(MA)?macrotema=saude&_=1721600000000",
    );
  });

  it("uses the configured report-service origin in local development", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL",
      "http://localhost:8000/",
    );
    vi.spyOn(Date, "now").mockReturnValue(1_721_600_000_000);

    const url = buildAutomaticReportUrl({
      city: "Água Branca (AL)",
      macrotheme: "demografia",
    });

    expect(url).toBe(
      "http://localhost:8000/relatorio/%C3%81gua%20Branca%20(AL)?macrotema=demografia&_=1721600000000",
    );
  });
});
