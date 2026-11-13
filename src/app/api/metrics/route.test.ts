// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getContent, pingContentful } from "@/utils/contentful";
import { resetMetricsChecks } from "./checks";
import { GET } from "./route";

vi.mock("@/utils/contentful", () => ({
  getContent: vi.fn(),
  pingContentful: vi.fn(),
}));

const TOKEN = "segredo-de-teste";
const PDF_LINK = "https://www.gov.br/sudene/ok.pdf/@@display-file/file";
const HTML_LINK = "https://www.gov.br/sudene/sem-sufixo.pdf";

/** Answers gov.br and Zenodo by URL: one PDF, one HTML page, Zenodo up. */
class ExternalHostsFetchFake {
  readonly fetch = vi.fn(async (input: string | URL) => {
    const url = String(input);
    if (url.startsWith("https://zenodo.org/")) return Response.json({});
    if (url === PDF_LINK) return new Response("%PDF-1.7\n...");
    if (url === HTML_LINK) return new Response("<!doctype html>");

    throw new Error(`ExternalHostsFetchFake: unexpected url "${url}"`);
  });
}

const metricsRequest = (authorization?: string) =>
  new Request("http://localhost/api/metrics", {
    headers: authorization ? { authorization } : {},
  });

const readMetrics = async () =>
  (await GET(metricsRequest(`Bearer ${TOKEN}`))).text();

beforeEach(() => {
  // O restoreAllMocks do vitest.setup não zera as chamadas dos vi.fn() do
  // vi.mock acima; sem isto, as contagens de um teste vazam para o seguinte.
  vi.clearAllMocks();
  resetMetricsChecks();
  vi.stubEnv("METRICS_TOKEN", TOKEN);
  vi.stubEnv("EXTERNAL_CHECKS", "1");
  vi.stubGlobal("fetch", new ExternalHostsFetchFake().fetch);
  vi.mocked(getContent).mockResolvedValue({
    postCollection: {
      items: [
        { sys: { id: "abre" }, title: 'Boletim "Água"', link: PDF_LINK },
        { sys: { id: "quebrado" }, title: "Sem sufixo", link: HTML_LINK },
      ],
    },
  });
  vi.mocked(pingContentful).mockResolvedValue({});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/metrics", () => {
  it("does not exist without METRICS_TOKEN configured", async () => {
    vi.stubEnv("METRICS_TOKEN", "");

    expect((await GET(metricsRequest(`Bearer ${TOKEN}`))).status).toBe(404);
  });

  it("refuses a wrong token before running any check", async () => {
    const response = await GET(metricsRequest("Bearer outro"));

    expect(response.status).toBe(401);
    expect(getContent).not.toHaveBeenCalled();
  });

  it("marks a boletim whose link returns HTML instead of a PDF", async () => {
    const body = await readMetrics();

    expect(body).toContain(
      'datane_boletim_up{id="abre",titulo="Boletim \\"Água\\""} 1',
    );
    expect(body).toContain(
      'datane_boletim_up{id="quebrado",titulo="Sem sufixo",error="not_a_pdf"} 0',
    );
  });

  it("runs no external check where EXTERNAL_CHECKS is off (failover)", async () => {
    vi.stubEnv("EXTERNAL_CHECKS", "");

    const response = await GET(metricsRequest(`Bearer ${TOKEN}`));

    expect(response.status).toBe(200);
    expect(await response.text()).not.toContain("datane_boletim_up{");
    expect(pingContentful).not.toHaveBeenCalled();
    expect(getContent).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports Contentful down and keeps the failure to spare the quota", async () => {
    vi.mocked(pingContentful).mockRejectedValue(new Error("HTTP 429"));
    vi.useFakeTimers({ toFake: ["Date"] });

    expect(await readMetrics()).toContain(
      'datane_dependency_up{dependency="contentful",error="failed"} 0',
    );

    // Past the 30 s report cache, still inside the 1 h Contentful cache.
    vi.setSystemTime(Date.now() + 60_000);
    await readMetrics();
    vi.useRealTimers();

    expect(pingContentful).toHaveBeenCalledTimes(1);
  });
});
