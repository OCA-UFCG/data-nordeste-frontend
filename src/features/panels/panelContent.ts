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

// PERF: com `force-dynamic` (as demos) o Next ignora o `revalidate: false` do
// getContent e não guarda o fetch; o unstable_cache guarda, com o `id` na chave.
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

/**
 * Texts of a native demo panel, from the "panels" entry its Power BI page uses
 * (`/data-panel/<id>`). A Contentful failure (error or missing entry) becomes
 * null and a console.error: the database numbers stay on screen.
 *
 * @example await loadDemoPanelContent("idh")
 */
export const loadDemoPanelContent = async (
  id: string,
): Promise<PanelContent | null> => {
  try {
    // O href da página do Power BI: assim o próprio painel não entra nos relacionados.
    const content = await loadPanelContent(id, `/data-panel/${id}`);

    if (content) return content;

    throw new Error(
      `Contentful has no "panels" entry titled "${id}"; expected one entry with the panel texts.`,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: `${id}_demo_content_failed`,
        id,
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};
