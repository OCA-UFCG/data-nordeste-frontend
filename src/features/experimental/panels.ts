import type { IPublication } from "@/utils/interfaces";

// Cada demo reaproveita a capa do post do painel original no Contentful
// (link "/data-panel/<id>"). Ordem = ordem dos cards em /demo.
export const EXPERIMENTAL_PANELS = [
  { link: "/data-panel/pib", href: "/demo/pib" },
  { link: "/data-panel/idh", href: "/demo/idh" },
  { link: "/data-panel/populacao", href: "/demo/perfil-demografico" },
  { link: "/data-panel/aridez", href: "/demo/aridez" },
];

export type ExperimentalPanel = { href: string; post: IPublication };

/**
 * Pairs each demo with its Contentful post, in EXPERIMENTAL_PANELS order; a demo
 * whose post is missing is left out. Example: `pickExperimentalPanels(posts)`
 * → `[{ href: "/demo/pib", post: { title: "Acessar Painel: PIB", ... } }, ...]`.
 */
export function pickExperimentalPanels(
  posts: IPublication[],
): ExperimentalPanel[] {
  return EXPERIMENTAL_PANELS.flatMap(({ link, href }) => {
    const post = posts.find((item) => item.link === link);

    return post ? [{ href, post }] : [];
  });
}
