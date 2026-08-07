import { afterEach, describe, expect, it, vi } from "vitest";
import { buildReportFileName, buildReportProxyUrl } from "./automaticReport";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("automatic report proxy URL", () => {
  it("builds the Next proxy URL with city and macrotheme", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_721_600_000_000);

    const url = buildReportProxyUrl({
      city: "São Luís (MA)",
      macrotheme: "saude",
    });

    expect(url).toBe(
      "/api/reports/generate?city=S%C3%A3o+Lu%C3%ADs+%28MA%29&macrotema=saude&_=1721600000000",
    );
  });

  it("appends a cache-busting timestamp on every call", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    const url = buildReportProxyUrl({
      city: "Recife (PE)",
      macrotheme: "demografia",
    });

    expect(url).toBe(
      "/api/reports/generate?city=Recife+%28PE%29&macrotema=demografia&_=1000",
    );
  });

  it("includes the gerado_apos freshness cursor when provided", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);

    const url = buildReportProxyUrl({
      city: "Recife (PE)",
      macrotheme: "demografia",
      geradoApos: "2026-08-04T17:01:17.000Z",
    });

    expect(url).toBe(
      "/api/reports/generate?city=Recife+%28PE%29&macrotema=demografia&_=1000&gerado_apos=2026-08-04T17%3A01%3A17.000Z",
    );
  });
});

describe("automatic report download name", () => {
  it("normalizes the municipality and state into a safe PDF filename", () => {
    expect(buildReportFileName("São Luís (MA)")).toBe(
      "relatorio_sao_luis_ma.pdf",
    );
  });
});
