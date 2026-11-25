import { describe, expect, it, vi } from "vitest";
import { loadPosterAssets, POSTER_LOGO_PATH } from "@/lib/posterAssets";

class PosterAssetsFake {
  requested: string[] = [];

  readonly deps = {
    fetchBlob: async (url: string) => {
      this.requested.push(url);

      return new Blob(["x"]);
    },
    readAsDataUrl: async () => "data:image/png;base64,LOGO",
  };
}

describe("loadPosterAssets", () => {
  it("loads the Data Nordeste logo as a data URL", async () => {
    const fake = new PosterAssetsFake();

    const assets = await loadPosterAssets({ icon: "usd" }, fake.deps);

    expect(fake.requested).toEqual([POSTER_LOGO_PATH]);
    expect(assets.logoDataUrl).toBe("data:image/png;base64,LOGO");
  });

  it("writes the panel icon as SVG markup", async () => {
    const assets = await loadPosterAssets(
      { icon: "usd" },
      new PosterAssetsFake().deps,
    );

    expect(assets.iconMarkup).toContain("<circle");
  });

  it("gives the site host without the protocol", async () => {
    const assets = await loadPosterAssets(
      { icon: "usd" },
      new PosterAssetsFake().deps,
    );

    expect(assets.siteUrl).toBe("datanordeste.sudene.gov.br");
  });

  // O cartaz leva o endereço do portal em produção, como no modelo, mesmo
  // quando o ambiente (beta, dev) aponta o NEXT_PUBLIC_SITE_URL para outro host.
  it("keeps the production host when the environment points elsewhere", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://beta-datanordeste.exemplo.br");
    vi.resetModules();
    const { loadPosterAssets: load } = await import("@/lib/posterAssets");

    const assets = await load({ icon: "usd" }, new PosterAssetsFake().deps);

    vi.unstubAllEnvs();
    expect(assets.siteUrl).toBe("datanordeste.sudene.gov.br");
  });
});
