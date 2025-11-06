import { DataRecords } from "@/components/DataRecords/DataRecords";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { FILTERS_QUERY } from "@/utils/queries";
import { Suspense } from "react";
import { MacroTheme } from "@/utils/interfaces";

interface IFilterDataPage {
  filterDataPageCollection: {
    items: {
      title: string;
      type: string;
      optionsCollection: {
        items: {
          title: string;
          slug: string;
        }[];
      };
    }[];
  };
  themeCollection: {
    items: MacroTheme[];
  };
}

export default async function CatalogPage() {
  const { filterDataPageCollection, themeCollection }: IFilterDataPage =
    await getContent(FILTERS_QUERY);

  const filters = filterDataPageCollection.items.map((item) => ({
    title: item.title,
    type: item.type,
    options: item.optionsCollection.items.map((opt) => ({
      slug: opt.slug,
      title: opt.title,
    })),
  }));

  const themes = (themeCollection?.items || []).filter(
    (theme): theme is MacroTheme => Boolean(theme),
  );

  return (
    <HubTemplate>
      <Suspense>
        <DataRecords filters={filters} themes={themes} />
      </Suspense>
    </HubTemplate>
  );
}
