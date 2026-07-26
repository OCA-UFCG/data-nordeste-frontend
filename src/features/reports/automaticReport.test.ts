import { afterEach, describe, expect, it, vi } from "vitest";
import { buildReportProxyUrl } from "./automaticReport";

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
});
