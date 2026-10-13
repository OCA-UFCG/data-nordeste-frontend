import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const GOV_BR_FILE =
  "https://www.gov.br/sudene/pt-br/assuntos/boletins-tematicos/arquivos/boletim.pdf";

class GovBrPdfFetchFake {
  constructor(private readonly contentType: string) {}

  readonly fetch = vi.fn(
    async (): Promise<Response> =>
      new Response("body", { headers: { "Content-Type": this.contentType } }),
  );
}

const requestPdf = (pdfUrl: string) =>
  GET(
    new Request(
      `http://localhost/api/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`,
    ),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PDF proxy", () => {
  it("fetches gov.br files from the download view", async () => {
    const govBr = new GovBrPdfFetchFake("application/pdf");
    vi.stubGlobal("fetch", govBr.fetch);

    const response = await requestPdf(GOV_BR_FILE);

    expect(response.status).toBe(200);
    expect(govBr.fetch).toHaveBeenCalledWith(`${GOV_BR_FILE}/@@download/file`);
  });

  it("rejects an HTML page instead of passing it to pdf.js", async () => {
    vi.stubGlobal("fetch", new GovBrPdfFetchFake("text/html").fetch);

    const response = await requestPdf(GOV_BR_FILE);

    expect(response.status).toBe(502);
  });
});
