import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("next/cache", () => cacheMocks);

// redirect() do Next interrompe a action lançando um erro; o mock faz o mesmo.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

const formWith = (password?: string) => {
  const formData = new FormData();

  if (password !== undefined) formData.set("senha", password);

  return formData;
};

describe("refreshContentCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("CONTENT_CACHE_PASSWORD", "segredo");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("clears the Contentful cache when the password matches", async () => {
    const { refreshContentCache } = await import("./actions");

    await expect(refreshContentCache(formWith("segredo"))).rejects.toThrow(
      "redirect:/atualizar-conteudo?resultado=atualizado",
    );
    expect(cacheMocks.updateTag).toHaveBeenCalledWith("contentful");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("keeps the cache and waits before answering a wrong password", async () => {
    const { refreshContentCache } = await import("./actions");
    const result = refreshContentCache(formWith("errada"));
    const assertion = expect(result).rejects.toThrow(
      "redirect:/atualizar-conteudo?resultado=senha-incorreta",
    );

    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(cacheMocks.updateTag).not.toHaveBeenCalled();
    expect(cacheMocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("refuses to run when no password is configured", async () => {
    vi.stubEnv("CONTENT_CACHE_PASSWORD", "");
    const { refreshContentCache } = await import("./actions");

    await expect(refreshContentCache(formWith(""))).rejects.toThrow(
      "redirect:/atualizar-conteudo?resultado=indisponivel",
    );
    expect(cacheMocks.updateTag).not.toHaveBeenCalled();
  });
});

describe("refreshReportDocsAction", () => {
  const docsService = {
    fetch: vi.fn(async (): Promise<Response> => Response.json({ docs: [] })),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("CONTENT_CACHE_PASSWORD", "segredo");
    vi.stubEnv("DOCS_ATUALIZAR_TOKEN", "token-do-servico");
    vi.stubEnv("AUTOMATIC_REPORT_API_URL", "http://automatic-report.test");
    vi.stubGlobal("fetch", docsService.fetch);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("calls the report service with its token when the password matches", async () => {
    const { refreshReportDocsAction } = await import("./actions");

    const outcome = await refreshReportDocsAction(null, formWith("segredo"));

    expect(outcome).toEqual({ kind: "concluido", docs: [] });
    expect(docsService.fetch).toHaveBeenCalledWith(
      "http://automatic-report.test/docs/atualizar",
      expect.objectContaining({
        headers: { "X-Docs-Token": "token-do-servico" },
      }),
    );
  });

  it("waits and never calls the service on a wrong password", async () => {
    const { refreshReportDocsAction } = await import("./actions");
    const outcome = refreshReportDocsAction(null, formWith("errada"));

    await vi.advanceTimersByTimeAsync(1000);

    await expect(outcome).resolves.toEqual({ kind: "senha-incorreta" });
    expect(docsService.fetch).not.toHaveBeenCalled();
  });

  it("is unavailable without the service token", async () => {
    vi.stubEnv("DOCS_ATUALIZAR_TOKEN", "");
    const { refreshReportDocsAction } = await import("./actions");

    await expect(
      refreshReportDocsAction(null, formWith("segredo")),
    ).resolves.toEqual({ kind: "indisponivel" });
    expect(docsService.fetch).not.toHaveBeenCalled();
  });
});
