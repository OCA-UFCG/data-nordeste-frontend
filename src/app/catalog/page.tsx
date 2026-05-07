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
import { RECORDS_PER_PAGE } from "@/utils/constants";
import {
  buildCatalogFilterValues,
  buildCatalogSlugTitleMap,
} from "@/features/catalog/filters";
import { applyCatalogFilterLabels } from "@/features/catalog/records";

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
    }[];
  };
  themeCollection?: {
    items: MacroTheme[];
  };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
  const urlSearchParams = new URLSearchParams(
    Object.entries(rawSearchParams).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((item) => [key, item])
        : value
          ? [[key, value]]
          : [],
    ),
  );
  const currentPage = Number(urlSearchParams.get("page") || 1);
  const filtersFromUrl = buildCatalogFilterValues(urlSearchParams, filters);
  const slugToTitle = buildCatalogSlugTitleMap(filters);
  const initialRecordsResult = await getZenodoCommunityRecords(
    currentPage,
    RECORDS_PER_PAGE,
    filtersFromUrl,
  );
  const initialRecords: IMetadata[] = applyCatalogFilterLabels(
    initialRecordsResult.records,
    slugToTitle,
  );

  return (
    <HubTemplate>
      {header && <PageHeader content={header} />}
      <Suspense>
        <DataRecords
          filters={filters}
          themes={themes}
          initialRecords={initialRecords}
          initialTotalPages={initialRecordsResult.totalPages}
        />
      </Suspense>
    </HubTemplate>
  );
}
