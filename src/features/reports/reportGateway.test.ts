import { afterEach, describe, expect, it, vi } from "vitest";
import { findAvailableAutomaticReport } from "./reportGateway";

const API_URL = "http://automatic-report.test";

class AutomaticReportIndexFetchFake {
  readonly fetch = vi.fn(async (): Promise<Response> =>
    Response.json([
      {
        arquivo_pdf: "relatorio_saude__maragogi.pdf",
        cidade: "Maragogi",
        macrotema: "Saúde",
        pdf_url: "/output/relatorio_saude__maragogi.pdf",
        last_modified_utc: "2026-08-12T17:48:08.000Z",
      },
    ]),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("automatic report city matching", () => {
  it("finds a backend report without a state suffix", async () => {
    const reportIndex = new AutomaticReportIndexFetchFake();
    vi.stubGlobal("fetch", reportIndex.fetch);
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", API_URL);

    const report = await findAvailableAutomaticReport(
      new URLSearchParams({ city: "Maragogi (AL)", macrotema: "saude" }),
      "2026-08-12T17:48:00.000Z",
    );

    expect(report).toEqual({
      fileName: "relatorio_saude__maragogi.pdf",
      pdfUrl: `${API_URL}/output/relatorio_saude__maragogi.pdf`,
    });
  });
});
