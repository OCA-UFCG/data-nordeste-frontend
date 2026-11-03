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
