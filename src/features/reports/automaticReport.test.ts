import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildReportFileName,
  buildReportProxyUrl,
  getAutomaticReportSlug,
  parseAutomaticReportSlug,
} from "./automaticReport";

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
  ])("maps the Contentful id %s to the backend slug", (themeId, slug) => {
    expect(getAutomaticReportSlug(themeId)).toBe(slug);
  });

  it("accepts the new backend slugs in a combined request", () => {
    expect(
      parseAutomaticReportSlug("desenvolvimento-social,meio-ambiente"),
    ).toEqual(["desenvolvimento-social", "meio-ambiente"]);
  });
});
