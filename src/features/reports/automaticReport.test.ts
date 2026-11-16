import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildReportFileName,
  buildReportProxyUrl,
  getAutomaticReportApiBaseUrl,
  getAutomaticReportSlug,
  parseAutomaticReportSlug,
} from "./automaticReport";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("automatic report API base URL", () => {
  // IMPORTANT: deploys rely on this precedence to keep server calls on the
  // Docker network. Beta reports broke in Nov/2026 while beta only had the
  // public URL, which loops back through the LSD front door.
  it("prefers the internal URL over the public one", () => {
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", "http://automatic-reporting:8000/");
    vi.stubEnv(
      "NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL",
      "https://reports.example.org",
    );

    expect(getAutomaticReportApiBaseUrl()).toBe(
      "http://automatic-reporting:8000",
    );
  });

  it("falls back to the public URL when no internal URL is set", () => {
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", undefined);
    vi.stubEnv(
      "NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL",
      "https://reports.example.org",
    );

    expect(getAutomaticReportApiBaseUrl()).toBe("https://reports.example.org");
  });
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

  it("monta a URL do proxy com arquivo e versao obsoleta", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);

    expect(
      buildReportProxyUrl({
        city: "Recife (PE)",
        macrotheme: "demografia",
        arquivo: "relatorio_demografia__recife_pe_.pdf",
        versaoObsoleta: "111",
      }),
    ).toBe(
      "/api/reports/generate?city=Recife+%28PE%29&macrotema=demografia&_=1000&arquivo=relatorio_demografia__recife_pe_.pdf&versao_obsoleta=111",
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

describe("automatic report macrothemes", () => {
  it.each([
    ["desenvolvimento_social", "desenvolvimento-social"],
    ["meio_ambiente", "meio-ambiente"],
    ["instrumentos_sudene", "instrumentos-sudene"],
  ])("maps the Contentful id %s to the backend slug", (themeId, slug) => {
    expect(getAutomaticReportSlug(themeId)).toBe(slug);
  });

  it("accepts the new backend slugs in a combined request", () => {
    expect(
      parseAutomaticReportSlug("desenvolvimento-social,meio-ambiente"),
    ).toEqual(["desenvolvimento-social", "meio-ambiente"]);
  });
});
