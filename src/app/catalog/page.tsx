import { DataRecords } from "@/components/DataRecords/DataRecords";
import PageHeader from "@/components/PageHeader/PageHeader";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { FILTERS_QUERY } from "@/utils/queries";
import { Suspense } from "react";
import {
  ContentfulRichTextField,
  IMetadata,
  MacroTheme,
} from "@/utils/interfaces";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import { getZenodoCommunityRecords } from "@/lib/zenodo";
import { dataSortingTypes, RECORDS_PER_PAGE } from "@/utils/constants";
import {
  buildCatalogRequest,
  buildCatalogSlugTitleMap,
} from "@/features/catalog/filters";
import { applyCatalogFilterLabels } from "@/features/catalog/records";
import { ExploreFilters } from "@/components/ExploreFilters/ExploreFilters";
import { normalizeKey } from "@/utils/functions";

export const metadata: Metadata = buildMetadata({
  title: "Catalogo de dados",
  description:
    "Catalogo de datasets abertos do Data Nordeste com arquivos, licencas, fontes e registros publicados no Zenodo.",
  path: "/catalog",
});

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
  pageHeadersCollection: {
    items: {
      title: string;
      subtitle?: string;
      richSubtitle?: ContentfulRichTextField;
      banner?: {
        url: string;
      };
    }[];
  };
  themeCollection?: {
    items: MacroTheme[];
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const rawSearchParams = await searchParams;
  const data: IFilterDataPage = await getContent(FILTERS_QUERY);

  const header = data.pageHeadersCollection?.items?.[0];
  const filters = data.filterDataPageCollection.items.map((item) => ({
    title: item.title,
    type: item.type,
    options: item.optionsCollection.items.map((opt) => ({
      slug: opt.slug,
      title: opt.title,
    })),
  }));

  const themes = (data.themeCollection?.items || []).filter(
    (theme): theme is MacroTheme => Boolean(theme),
  );
  const slugToTitle = buildCatalogSlugTitleMap(filters);
  const slugByNormalizedTitle = Object.fromEntries(
    Object.entries(slugToTitle).map(([slug, title]) => [
      normalizeKey(title),
      slug,
    ]),
  );
  const categoryValues = Object.fromEntries(
    themes.map((theme) => [
      theme.sys.id,
      slugByNormalizedTitle[normalizeKey(theme.name)] || theme.id,
    ]),
  );
  const { currentPage, filterValues } = buildCatalogRequest(
    rawSearchParams,
    filters,
  );
  const catalogRecords = await getZenodoCommunityRecords(
    currentPage,
    RECORDS_PER_PAGE,
    filterValues,
  );
  const initialRecords: IMetadata[] = applyCatalogFilterLabels(
    catalogRecords.records,
    slugToTitle,
  );

  return (
    <HubTemplate>
      {header && <PageHeader content={header} />}
      <div className="pt-12" />
      <Suspense>
        <ExploreFilters
          themes={themes}
          categoryValues={categoryValues}
          sortingOptions={dataSortingTypes}
        />
      </Suspense>
      <Suspense>
        <DataRecords
          themes={themes}
          initialRecords={initialRecords}
          currentPage={catalogRecords.currentPage}
          totalPages={catalogRecords.totalPages}
        />
      </Suspense>
    </HubTemplate>
  );
}
