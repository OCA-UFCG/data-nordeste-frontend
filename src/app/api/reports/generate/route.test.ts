import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const API_URL = "http://automatic-report.test";

class AutomaticReportFetchFake {
  readonly requestedUrls: string[] = [];

  fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = input.toString();
    this.requestedUrls.push(url);

    if (url.includes("/relatorio/")) return this.generationResponse();
    if (url.endsWith("/relatorios")) return this.reportIndexResponse();
    if (url.endsWith("relatorio_saude__recife.pdf")) {
      return this.pdfResponse();
    }

    return new Response("Not found", { status: 404 });
  };

  private generationResponse(): Response {
    return new Response("<html>Relatório</html>", {
      headers: { "Content-Type": "text/html" },
    });
  }

  private reportIndexResponse(): Response {
    return Response.json([
      this.reportEntry("Salvador Ba", "/output/relatorio_saude__salvador.pdf"),
      this.reportEntry("Recife Pe", "/output/relatorio_saude__recife.pdf"),
    ]);
  }

  private reportEntry(cidade: string, pdfUrl: string): object {
    return {
      arquivo_pdf: pdfUrl.split("/").at(-1),
      cidade,
      macrotema: "Saúde",
      pdf_url: pdfUrl,
    };
  }

  private pdfResponse(): Response {
    return new Response(new TextEncoder().encode("%PDF-1.7 test"), {
      headers: { "Content-Type": "application/pdf" },
    });
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AUTOMATIC_REPORT_API_URL;
});

describe("automatic report generation proxy", () => {
  it("returns the generated municipality PDF inline", async () => {
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    process.env.AUTOMATIC_REPORT_API_URL = API_URL;
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="relatorio_saude__recife.pdf"',
    );
    expect(await response.text()).toBe("%PDF-1.7 test");
    expect(automaticReportApi.requestedUrls.at(-1)).toBe(
      `${API_URL}/output/relatorio_saude__recife.pdf`,
    );
  });
});
