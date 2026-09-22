import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { GET as DOWNLOAD } from "@/app/api/reports/download/route";

const API_URL = "http://automatic-report.test";

class AutomaticReportFetchFake {
  readonly requestedUrls: string[] = [];

  /** `artefato` mimics the `X-Relatorio-Arquivo` header; null = backend without it. */
  constructor(private readonly artefato: string | null = null) {}

  fetch = async (input: RequestInfo | URL): Promise<Response> => {
    const url = input.toString();
    this.requestedUrls.push(url);

    if (url.includes("/relatorio/")) return this.generationResponse();
    if (url.endsWith("/relatorios")) return this.reportIndexResponse();
    if (url.includes("/output/relatorio_")) return this.pdfResponse();

    return new Response("Not found", { status: 404 });
  };

  private generationResponse(): Response {
    const headers: Record<string, string> = { "Content-Type": "text/html" };
    if (this.artefato) headers["X-Relatorio-Arquivo"] = this.artefato;

    return new Response("<html>Relatório</html>", { headers });
  }

  private reportIndexResponse(): Response {
    return Response.json([
      this.reportEntry(
        "Salvador Ba",
        "/output/relatorio_saude__salvador.pdf",
        "2026-08-03T10:00:00.000Z",
      ),
      this.reportEntry(
        "Recife Pe",
        "/output/relatorio_saude__recife.pdf",
        "2026-08-03T10:00:00.000Z",
      ),
      this.reportEntry(
        "Bel M Al",
        "/output/relatorio_economia-renda__bel_m_al_.pdf",
        "2026-08-03T10:00:00.000Z",
      ),
      this.reportEntry(
        "Recife Pe",
        "/output/relatorio_educacao_saude__recife.pdf",
        "2026-08-01T10:00:00.000Z",
      ),
    ]);
  }

  private reportEntry(
    cidade: string,
    pdfUrl: string,
    lastModifiedUtc: string,
  ): object {
    return {
      arquivo_pdf: pdfUrl.split("/").at(-1),
      cidade,
      macrotema: "Saúde",
      pdf_url: pdfUrl,
      last_modified_utc: lastModifiedUtc,
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
      fileName: "relatorio_recife_pe.pdf",
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
      fileName: "relatorio_belem_al.pdf",
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
      'inline; filename="relatorio_recife_pe.pdf"',
    );
    expect(await response.text()).toBe("%PDF-1.7 test");
    expect(automaticReportApi.requestedUrls.at(-1)).toBe(
      `${API_URL}/output/relatorio_saude__recife.pdf`,
    );
  });

  it("no longer gates the poll by gerado_apos (freshness dropped; task 7 removes this branch)", async () => {
    // gerado_apos ainda é enviado pelo front-end, mas o gateway não lê mais esse
    // parâmetro: sem nome de artefato, o fallback casa só por cidade+macrotema,
    // sem checar frescor. Esta era a heurística de mtime-vs-clique que causava o
    // bug P1 (HIT de cache nunca reconhecido); a versão que a substitui só se
    // aplica quando o backend nomeia o artefato — este branch sem nome fica sem
    // gate até a tarefa 7 removê-lo.
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude&gerado_apos=2026-08-04T17%3A01%3A17.000Z",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      fileName: "relatorio_recife_pe.pdf",
      url: "/api/reports/download?city=Recife%20(PE)&macrotema=saude&gerado_apos=2026-08-04T17%3A01%3A17.000Z",
    });
  });

  it("serves a cached report the backend identified by header", async () => {
    // A regressão do cache: num HIT o backend devolve o artefato em disco sem
    // reescrevê-lo, então o mtime continua anterior ao clique e o filtro por
    // gerado_apos nunca casava — o portal ficava em 202 até estourar o polling.
    // Com o artefato identificado, o frescor é decidido pelo gate do backend.
    const automaticReportApi = new AutomaticReportFetchFake(
      "relatorio_saude__recife.pdf",
    );
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude&gerado_apos=2026-09-01T00%3A00%3A00.000Z",
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      fileName: "relatorio_recife_pe.pdf",
      url: "/api/reports/download?city=Recife%20(PE)&macrotema=saude&gerado_apos=2026-09-01T00%3A00%3A00.000Z&arquivo=relatorio_saude__recife.pdf",
    });
  });

  it("streams the exact artifact named in arquivo, not the newest match", async () => {
    // relatorio_saude__recife.pdf casa por substring com um pedido de combo
    // educacao,saude e é MAIS NOVO que o combo no índice. Sem o nome exato, o
    // portal entregaria o relatório de tema único no lugar do combo pedido.
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/download?city=Recife%20(PE)&macrotema=educacao,saude&arquivo=relatorio_educacao_saude__recife.pdf",
    );

    const response = await DOWNLOAD(request);

    expect(response.status).toBe(200);
    expect(automaticReportApi.requestedUrls.at(-1)).toBe(
      `${API_URL}/output/relatorio_educacao_saude__recife.pdf`,
    );
  });
});
