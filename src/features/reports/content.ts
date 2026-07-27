import { unstable_cache } from "next/cache";
import { REPORT_PAGE_QUERY } from "@/utils/queries/reports";
import { REVALIDATE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import type { ContentfulRichTextField, MacroTheme } from "@/utils/interfaces";

export type ReportPage = {
  banner?: { url: string };
  textoDoBanner?: ContentfulRichTextField;
  textoDoMunicipio?: ContentfulRichTextField;
  textoDoTema?: ContentfulRichTextField;
};

type ReportPageContent = {
  reportCollection: { items: ReportPage[] };
  themeCollection: { items: MacroTheme[] };
};

export type ReportPageData = {
  themes: MacroTheme[];
  page: ReportPage | null;
};

/** Loads the report page content and macrothemes. Example: `await getReportPageData()`. */
export const getReportPageData = unstable_cache(
  async (): Promise<ReportPageData> => {
    const content = await getContent<ReportPageContent>(REPORT_PAGE_QUERY);
    const page = content.reportCollection.items[0] ?? null;

    return {
      page,
      themes: content.themeCollection.items.filter(Boolean),
    };
  },
  ["report-page-data"],
  { revalidate: REVALIDATE },
);
