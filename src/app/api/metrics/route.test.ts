// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TOKEN = "segredo-de-teste";
const PDF_LINK = "https://www.gov.br/sudene/ok.pdf/@@display-file/file";
const HTML_LINK = "https://www.gov.br/sudene/sem-sufixo.pdf";

const BOLETIM_ITEMS = [
  { sys: { id: "abre" }, title: 'Boletim "Água"', link: PDF_LINK },
  { sys: { id: "quebrado" }, title: "Sem sufixo", link: HTML_LINK },
];

/** Answers every host the monitor reaches: Contentful (ping and list), Zenodo and gov.br. */
class ExternalHostsFetchFake {
  readonly fetch = vi.fn(
    async (input: string | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      if (url.endsWith("/contentful-api")) return this.contentful(init);
      if (url.startsWith("https://zenodo.org/")) return Response.json({});
      if (url === PDF_LINK) return new Response("%PDF-1.7\n...");
      if (url === HTML_LINK) return new Response("<!doctype html>");

      throw new Error(`ExternalHostsFetchFake: unexpected url "${url}"`);
    },
  );

  private contentful(init?: RequestInit): Response {
    const isList = String(init?.body).includes("GetBoletimLinks");
    const data = isList
      ? { postCollection: { items: BOLETIM_ITEMS } }
      : { __typename: "Query" };

    return Response.json({ data });
  }
}

let hosts: ExternalHostsFetchFake;

// Cada teste importa a rota de novo: o estado do monitor é do módulo carregado.
const loadRoute = async () => (await import("./route")).GET;

const metricsRequest = (authorization?: string) =>
  new Request("http://localhost/api/metrics", {
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  vi.resetModules();
  hosts = new ExternalHostsFetchFake();
  vi.stubGlobal("fetch", hosts.fetch);
  vi.stubEnv("METRICS_TOKEN", TOKEN);
  vi.stubEnv("EXTERNAL_CHECKS", "1");

  // Sem Contentful direto: o cliente cai no /contentful-api, que a fake responde.
  vi.stubEnv("NEXT_PUBLIC_CONTENTFUL_SPACE", "");
  vi.stubEnv("NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/metrics", () => {
  it("does not exist without METRICS_TOKEN configured", async () => {
    vi.stubEnv("METRICS_TOKEN", "");
    const GET = await loadRoute();

    expect((await GET(metricsRequest(`Bearer ${TOKEN}`))).status).toBe(404);
  });

  it("refuses a wrong token before running any check", async () => {
    const GET = await loadRoute();

    const response = await GET(metricsRequest("Bearer outro"));

    expect(response.status).toBe(401);
    expect(hosts.fetch).not.toHaveBeenCalled();
  });

  it("serves the Prometheus text format, uncached", async () => {
    const GET = await loadRoute();

    const response = await GET(metricsRequest(`Bearer ${TOKEN}`));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("reports the dependencies and each boletim, with the failure apart", async () => {
    const GET = await loadRoute();

    const body = await (await GET(metricsRequest(`Bearer ${TOKEN}`))).text();

    expect(body).toContain('datane_dependency_up{dependency="contentful"} 1');
    expect(body).toContain('datane_dependency_up{dependency="zenodo"} 1');
    expect(body).toContain(
      'datane_boletim_up{id="abre",titulo="Boletim \\"Água\\""} 1',
    );
    expect(body).toContain(
      'datane_boletim_up{id="quebrado",titulo="Sem sufixo"} 0',
    );
    expect(body).toContain(
      'datane_boletim_error{id="quebrado",error="not_a_pdf"} 1',
    );
  });

  it("runs no external check where EXTERNAL_CHECKS is off (failover)", async () => {
    vi.stubEnv("EXTERNAL_CHECKS", "");
    const GET = await loadRoute();

    const response = await GET(metricsRequest(`Bearer ${TOKEN}`));

    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("datane_boletim_up{");
    expect(hosts.fetch).not.toHaveBeenCalled();
  });
});
