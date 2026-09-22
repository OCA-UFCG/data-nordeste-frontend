import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { GET as DOWNLOAD } from "@/app/api/reports/download/route";

const API_URL = "http://automatic-report.test";

class AutomaticReportFetchFake {
  readonly requestedUrls: string[] = [];

  /**
   * `artefato` mimics the `X-Relatorio-Arquivo` header (null = backend without
   * it); `versao` mimics `X-Relatorio-Versao`.
   */
  constructor(
    private readonly artefato: string | null = null,
    private readonly versao: string | null = null,
  ) {}

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
    if (this.versao) headers["X-Relatorio-Versao"] = this.versao;

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
  it("POST devolve arquivo e versao lidos dos headers do backend", async () => {
    const automaticReportApi = new AutomaticReportFetchFake(
      "relatorio_demografia__recife_pe_.pdf",
      "111",
    );
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=demografia",
      { method: "POST" },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ready",
      arquivo: "relatorio_demografia__recife_pe_.pdf",
      versao: "111",
    });
  });

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

    // Polling now always carries the artifact name the earlier POST returned.
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude&arquivo=relatorio_saude__recife.pdf",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      fileName: "relatorio_recife_pe.pdf",
      url: "/api/reports/download?city=Recife%20(PE)&macrotema=saude&arquivo=relatorio_saude__recife.pdf",
    });
  });

  it("streams the ready municipality PDF inline", async () => {
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/download?city=Recife%20(PE)&macrotema=saude&arquivo=relatorio_saude__recife.pdf",
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

  it("rejects a poll without an arquivo instead of falling back to city+macrotheme", async () => {
    // O casamento por cidade+macrotema (e a heurística de acento que vinha com
    // ele) foi removido: com os dois chamadores mandando `arquivo`, um poll sem
    // nome é um cliente que pulou o POST, não um caso a resolver por fallback.
    const automaticReportApi = new AutomaticReportFetchFake();
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude&versao_obsoleta=999",
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it("serves a cached report the backend identified by header", async () => {
    // A regressão do cache: num HIT o backend devolve o artefato em disco sem
    // reescrevê-lo, então o mtime nunca ficava mais novo que o clique. Com o
    // nome e a versão vindos direto dos headers do backend, o POST não precisa
    // mais resolver contra o índice nem depender de mtime para responder ready.
    const automaticReportApi = new AutomaticReportFetchFake(
      "relatorio_saude__recife.pdf",
      "42",
    );
    vi.stubGlobal("fetch", automaticReportApi.fetch);
    vi.stubEnv("NEXT_PUBLIC_AUTOMATIC_REPORT_API_URL", API_URL);
    const request = new NextRequest(
      "http://localhost/api/reports/generate?city=Recife%20(PE)&macrotema=saude",
      { method: "POST" },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ready",
      arquivo: "relatorio_saude__recife.pdf",
      versao: "42",
      fileName: "relatorio_recife_pe.pdf",
      url: "/api/reports/download?city=Recife%20(PE)&macrotema=saude&arquivo=relatorio_saude__recife.pdf",
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
