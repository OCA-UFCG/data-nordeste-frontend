import { unstable_cache } from "next/cache";
import { getContent } from "@/utils/contentful";
import { HEAD_QUERY } from "@/utils/queries";
import type { ISection } from "@/utils/interfaces";
import { REVALIDATE } from "@/utils/constants";

type NavigationContent = {
  headerCollection: { items: ISection[] };
};

// PERF: Navigation is shared by every route. Keep one cached read so a slow
// Contentful response cannot multiply across concurrent page requests.
export const getNavigationSections = unstable_cache(
  async (): Promise<ISection[]> => {
    const content = await getContent<NavigationContent>(HEAD_QUERY);

    return content.headerCollection.items;
  },
  ["global-navigation-sections"],
  { revalidate: REVALIDATE },
);
