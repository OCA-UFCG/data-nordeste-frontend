import { describe, expect, it, vi } from "vitest";
import {
  parseReportDocs,
  refreshReportDocs,
  summarizeReportDocs,
} from "./reportDocsRefresh";

const API_URL = "http://automatic-report.test";

const BACKEND_BODY = {
  docs: [
    { rotulo: "saude", estado: "atualizado", avisos: [], caracteres: 120 },
    {
      rotulo: "saude (área)",
      estado: "com_problema",
      avisos: ["Para quando ...\n    → comparação não reconhecida"],
      caracteres: 90,
    },
  ],
};

class DocsRefreshFetchFake {
  constructor(private readonly response: () => Response) {}

  readonly fetch = vi.fn(async (): Promise<Response> => this.response());
}

describe("refreshReportDocs", () => {
  it("posts with the token header and returns each Doc's result", async () => {
    const service = new DocsRefreshFetchFake(() => Response.json(BACKEND_BODY));

    const outcome = await refreshReportDocs({
      apiBaseUrl: API_URL,
      token: "segredo",
      fetcher: service.fetch,
    });

    expect(service.fetch).toHaveBeenCalledWith(
      `${API_URL}/docs/atualizar`,
      expect.objectContaining({
        method: "POST",
        headers: { "X-Docs-Token": "segredo" },
      }),
    );
    expect(outcome).toEqual({
      kind: "concluido",
      docs: [
        { label: "saude", status: "atualizado", warnings: [] },
        {
          label: "saude (área)",
          status: "com_problema",
          warnings: ["Para quando ...\n    → comparação não reconhecida"],
        },
      ],
    });
  });

  it.each([
    [409, { kind: "em-andamento" }],
    [503, { kind: "indisponivel" }],
    [401, { kind: "erro", message: "O serviço de relatórios respondeu 401." }],
  ])("maps HTTP %i to a screen outcome", async (status, expected) => {
    const service = new DocsRefreshFetchFake(
      () => new Response(null, { status }),
    );

    const outcome = await refreshReportDocs({
      apiBaseUrl: API_URL,
      token: "segredo",
      fetcher: service.fetch,
    });

    expect(outcome).toEqual(expected);
  });

  it("turns a network failure into an error outcome instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const service = new DocsRefreshFetchFake(() => {
      throw new TypeError("fetch failed");
    });

    const outcome = await refreshReportDocs({
      apiBaseUrl: API_URL,
      token: "segredo",
      fetcher: service.fetch,
    });

    expect(outcome).toEqual({
      kind: "erro",
      message: "Não foi possível falar com o serviço de relatórios.",
    });
  });
});

describe("parseReportDocs", () => {
  it("rejects a body that is not the backend shape, naming the value", () => {
    expect(() => parseReportDocs({ docs: [{ rotulo: "x" }] })).toThrow(
      'Invalid /docs/atualizar body {"docs":[{"rotulo":"x"}]}',
    );
  });
});

describe("summarizeReportDocs", () => {
  it("counts failed and problematic Docs as blocked", () => {
    expect(
      summarizeReportDocs([
        { label: "a", status: "atualizado", warnings: [] },
        { label: "b", status: "com_problema", warnings: ["x"] },
        { label: "c", status: "falhou", warnings: ["y"] },
      ]),
    ).toEqual({ updated: 1, blocked: 2 });
  });
});
