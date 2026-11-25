import { protoIconMarkup } from "@/components/ProtoPanel/protoIconMarkup";
import type { MapPosterData } from "@/features/panels/mapPosterData";
import {
  type MapPosterAssets,
  POSTER_SITE_HOST,
} from "@/features/panels/mapPoster";

// O logo do modelo (NE verde com "DATA NORDESTE"), servido de `public/`.
export const POSTER_LOGO_PATH = "/datane-logo.png";

export type PosterAssetDeps = {
  fetchBlob: (url: string) => Promise<Blob>;
  readAsDataUrl: (blob: Blob) => Promise<string>;
};

export const browserPosterAssetDeps: PosterAssetDeps = {
  fetchBlob: async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Poster logo request to "${url}" failed with status ${response.status}; expected the image from public/.`,
      );
    }

    return response.blob();
  },
  readAsDataUrl: (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () =>
        reject(
          new Error(`Poster logo of ${blob.size} bytes could not be read.`),
        );
      reader.readAsDataURL(blob);
    }),
};

/**
 * O que o cartaz precisa além dos dados do painel: o logo (embutido como data
 * URL, porque o SVG vira imagem e não busca arquivos), o ícone do painel e o
 * endereço do portal em produção, sem o protocolo.
 *
 * @example await loadPosterAssets({ icon: "usd" }) // { logoDataUrl, iconMarkup, siteUrl: "datanordeste.sudene.gov.br" }
 */
export const loadPosterAssets = async (
  poster: Pick<MapPosterData, "icon">,
  deps: PosterAssetDeps = browserPosterAssetDeps,
): Promise<MapPosterAssets> => ({
  logoDataUrl: await deps.readAsDataUrl(await deps.fetchBlob(POSTER_LOGO_PATH)),
  iconMarkup: protoIconMarkup(poster.icon),

  // INTENTIONAL: sempre o portal em produção, como no modelo; o
  // NEXT_PUBLIC_SITE_URL do beta/dev não deve aparecer no cartaz baixado.
  siteUrl: POSTER_SITE_HOST,
});
