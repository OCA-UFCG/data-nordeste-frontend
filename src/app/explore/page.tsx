import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import { ExploreFilters } from "@/components/ExploreFilters/ExploreFilters";
import { MacroThemeTabs } from "@/components/MacroThemeTabs/MacroThemeTabs";
import type { TabType } from "@/components/MacroThemeTabs/MacroThemeTabs";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IPageHeader, IPublication, MacroTheme } from "@/utils/interfaces";
import { EXPLORE_PAGE_QUERY, PUBLICATION_QUERY } from "@/utils/queries";
import { Suspense } from "react";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import {
  buildPostsContentfulFilter,
  buildPostsSkip,
  buildPostsTotalPages,
  parsePostsQueryState,
} from "@/features/posts/filters";

export const metadata: Metadata = buildMetadata({
  title: "Explorar",
  description:
    "Explore paineis interativos, datastories e experiencias de dados sobre desenvolvimento regional no Nordeste.",
  path: "/explore",
});

const TYPE_IN_BY_TAB: Record<TabType, string> = {
  paineis: "data-panel",
  datastories: "data-story",
  boletins: "newsletter,additional-content",
};

const TAB_HEADERS_IDS: Record<string, string> = {
  dataPanels: "dashboards",
  dataNarrative: "datastories",
  publications: "publications",
};

function deriveTabFromUrl(urlParams: URLSearchParams): TabType {
  const rawTypeIn = urlParams.get("type_in") ?? "";

  if (rawTypeIn === "data-panel") return "paineis";
  if (rawTypeIn === "data-story") return "datastories";
  if (rawTypeIn.includes(",")) return "boletins";

  return "paineis";
}

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  tabHeadersCollection: { items: IPageHeader[] };
  themeCollection: { items: MacroTheme[] };
}

interface IInitialPostsContent {
  postCollection: { total: number; items: IPublication[] };
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const rawSearchParams = await searchParams;
  const urlSearchParams = new URLSearchParams(
    Object.entries(rawSearchParams).flatMap(([key, value]) =>
      Array.isArray(value)
        ? value.map((item) => [key, item])
        : value
          ? [[key, value]]
          : [],
    ),
  );

  const activeTab = deriveTabFromUrl(urlSearchParams);
  const typeInValue = TYPE_IN_BY_TAB[activeTab];

  const rootFilter = { type_in: typeInValue };

  const initialQueryState = parsePostsQueryState(
    urlSearchParams,
    Number.MAX_SAFE_INTEGER,
  );
  const {
    pageHeadersCollection: pageHeaders,
    tabHeadersCollection: tabHeaders,
    themeCollection: themes,
  }: IPostsContent = await getContent(EXPLORE_PAGE_QUERY, {
    header_id: "panels",
    head_id: "interactive-panels",
  });
  const { postCollection: initialPosts }: IInitialPostsContent =
    await getContent(PUBLICATION_QUERY, {
      order: initialQueryState.sorting,
      skip: buildPostsSkip(initialQueryState.currentPage),
      filter: buildPostsContentfulFilter(initialQueryState.filter, rootFilter),
    });
  const totalPages = buildPostsTotalPages(initialPosts.total);

  const tabHeadersById = new Map(
    tabHeaders.items
      .filter((h): h is IPageHeader & { id: string } => Boolean(h?.id))
      .map((h) => [TAB_HEADERS_IDS[h.id] ?? h.id, h]),
  );

  return (
    <HubTemplate>
      <PageHeader content={pageHeaders.items[0]} />
      <div className="pt-6 sm:pt-12" />
      <ExploreFilters themes={themes.items} />
      <div className="h-4 sm:h-6" />
      <section className="w-full bg-[#F8F7F8]">
        <Suspense>
          <MacroThemeTabs
            dashboards={[]}
            datastories={[]}
            publicacoes={[]}
            headers={{
              dashboards: tabHeadersById.get("dashboards"),
              datastories: tabHeadersById.get("datastories"),
              publications: tabHeadersById.get("publications"),
            }}
            urls={{
              dashboardsHref: "",
              datastoriesHref: "",
              postsByThemeHref: "",
            }}
            tabsOnly
            showHeaderInTabsOnly
            showViewAll={false}
            activeTab={activeTab}
          />
        </Suspense>
        <Suspense>
          <Posts
            rootFilter={rootFilter}
            totalPages={totalPages || 1}
            initialPosts={initialPosts.items}
          />
        </Suspense>
      </section>
    </HubTemplate>
  );
}
