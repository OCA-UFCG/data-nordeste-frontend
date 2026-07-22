import { unstable_cache } from "next/cache";
import { REVALIDATE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import type { MacroTheme } from "@/utils/interfaces";

type ReportPageContent = {
  themeCollection: {
    items: MacroTheme[];
  };
};

const REPORT_PAGE_QUERY = `
  query GetReportPageThemes($preview: Boolean) {
    themeCollection(limit: 30, preview: $preview) {
      items {
        name
        id
        color
        sys {
          id
        }
      }
    }
  }
`;

/** Loads macrothemes used by the report builder. Example: `await getReportThemes()`. */
export const getReportThemes = unstable_cache(
  async (): Promise<MacroTheme[]> => {
    const content = await getContent<ReportPageContent>(REPORT_PAGE_QUERY);

    return content.themeCollection.items.filter(Boolean);
  },
  ["report-page-themes"],
  { revalidate: REVALIDATE },
);
