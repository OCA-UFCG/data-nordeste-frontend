import { unstable_cache } from "next/cache";
import { CONTENTFUL_CACHE_TAG } from "@/config/revalidation";
import { getSearchIndex } from "@/features/search/contentful";
import { getRelatedPanelItems } from "@/features/search/relatedPanels";
import type { SearchResult } from "@/features/search/types";
import { REVALIDATE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import type { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";
import { richTextToPlainText } from "@/utils/richText";

type DataPanelContent = {
  panelsCollection: { items: ReportData[] };
};

type PanelContentRequest = <T>(
  query: string,
  variables: { id: string },
) => Promise<T>;

export type PanelContent = {
  panel: ReportData;
  relatedItems: SearchResult[];
};

const CONTENTFUL_CACHE_OPTIONS: { revalidate: number | false; tags: string[] } =
  {
    revalidate: REVALIDATE,
    tags: [CONTENTFUL_CACHE_TAG],
  };

/**
 * Reads the "panels" entry whose title is `id`; null when it does not exist.
 *
 * @example await createPanelEntryReader(getContent)("pib")
 */
export const createPanelEntryReader =
  (requestContent: PanelContentRequest) =>
  async (id: string): Promise<ReportData | null> => {
    const content = await requestContent<DataPanelContent>(DATA_PANEL_QUERY, {
      id,
    });

    return content.panelsCollection.items[0] ?? null;
  };

// PERF: unstable_cache, não só o cache do fetch do getContent. Com
// `dynamic = "force-dynamic"` (as demos), o Next trata `revalidate: false` como
// ausente e não guarda o fetch; dentro do unstable_cache o fetch é no-store, então
// o conteúdo fica guardado uma vez só. A chave inclui o `id`.
export const getPanelEntry = unstable_cache(
  createPanelEntryReader(getContent),
  ["panel-entry"],
  CONTENTFUL_CACHE_OPTIONS,
);

const getPanelSearchItems = unstable_cache(
  async () => (await getSearchIndex()).items,
  ["panel-search-items"],
  CONTENTFUL_CACHE_OPTIONS,
);

/**
 * Panel texts plus "Conteúdos relacionados", the same on the Power BI page and
 * the native demos. `href` is the panel's own page, kept out of the related list.
 *
 * @example await loadPanelContent("pib", "/data-panel/pib")
 */
export const loadPanelContent = async (
  id: string,
  href: string,
): Promise<PanelContent | null> => {
  const [panel, searchItems] = await Promise.all([
    getPanelEntry(id),
    getPanelSearchItems(),
  ]);

  if (!panel) return null;

  const relatedItems = getRelatedPanelItems(searchItems, {
    title: panel.title,
    href,
    macroTheme: panel.macroTheme,
    descriptionTitle: panel.descriptionTitle,
    descriptionText: richTextToPlainText(panel.description),
  });

  return { panel, relatedItems };
};
