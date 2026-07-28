import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { GET as DOWNLOAD } from "@/app/api/reports/download/route";

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
      this.reportEntry(
        "Bel M Al",
        "/output/relatorio_economia-renda__bel_m_al_.pdf",
      ),
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
  vi.unstubAllEnvs();
});

describe("automatic report generation proxy", () => {
  it("starts generation and returns immediately", async () => {
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude",
    );

    const response = await POST(request);

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ status: "processing" });
    expect(automaticReportApi.requestedUrls).toHaveLength(1);
  });

  it("returns a same-origin download URL when the report is ready", async () => {
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      fileName: "relatorio_saude__recife.pdf",
      url: "/api/reports/download?city=Recife%20(PE)&macrotema=saude",
    });
  });

  it("finds legacy report filenames that dropped accented characters", async () => {
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Bel%C3%A9m%20(AL)&macrotema=economia-renda",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      fileName: "relatorio_economia-renda__bel_m_al_.pdf",
      url: "/api/reports/download?city=Bel%C3%A9m%20(AL)&macrotema=economia-renda",
    });
  });

  it("streams the ready municipality PDF inline", async () => {
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/download?city=Recife%20(PE)&macrotema=saude",
    );

    const response = await DOWNLOAD(request);

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
