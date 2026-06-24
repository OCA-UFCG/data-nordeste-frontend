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
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";

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

interface IPostsCount {
  postCollection: { total: number };
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

  const [dashboardsPosts, datastoriesPosts, boletinsPosts] = await Promise.all([
    getContent<IPostsCount>(PUBLICATION_QUERY, {
      order: initialQueryState.sorting,
      skip: 0,
      limit: 1,
      filter: buildPostsContentfulFilter(initialQueryState.filter, {
        type_in: "data-panel",
      }),
    }),
    getContent<IPostsCount>(PUBLICATION_QUERY, {
      order: initialQueryState.sorting,
      skip: 0,
      limit: 1,
      filter: buildPostsContentfulFilter(initialQueryState.filter, {
        type_in: "data-story",
      }),
    }),
    getContent<IPostsCount>(PUBLICATION_QUERY, {
      order: initialQueryState.sorting,
      skip: 0,
      limit: 1,
      filter: buildPostsContentfulFilter(initialQueryState.filter, {
        type_in: ["newsletter", "additional-content"],
      }),
    }),
  ]);

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
      <section className="relative w-full overflow-hidden h-[226px] sm:h-[200px] lg:h-[220px]">
        <div
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={
            pageHeaders.items[0]?.banner?.url
              ? {
                  backgroundImage: `url(${pageHeaders.items[0].banner.url})`,
                  backgroundPosition: "center 35%",
                }
              : undefined
          }
        />

        <div
          className="absolute inset-0 sm:hidden"
          style={{
            background:
              "linear-gradient(359.78deg, rgba(0,0,0,0.92) 0.2%, rgba(0,0,0,0) 195.14%)",
          }}
        />

        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background: `
        linear-gradient(90deg, #000000 14.27%, rgba(102,102,102,0) 31.53%),
        linear-gradient(0deg, rgba(0,0,0,0.92) -41.89%, rgba(0,0,0,0) 195.68%)
      `,
          }}
        />

        <div
          className="relative z-10 flex w-full h-full max-w-[1440px] mx-auto
      items-start p-6
      sm:items-end sm:px-6 sm:pb-6 sm:pt-0
      lg:px-20 lg:pb-12"
        >
          <div className="flex flex-col gap-4 lg:gap-2 w-full max-w-[1280px]">
            <h1 className="text-[30px] lg:text-[48px] font-extrabold leading-[36px] lg:leading-[48px] tracking-[-0.0075em] text-[#F8F7F8]">
              {pageHeaders.items[0]?.title}
            </h1>

            {pageHeaders.items[0]?.richSubtitle ? (
              <div className="text-[14px] font-normal leading-[21px] text-[#F8F7F8] [&_p]:m-0">
                {documentToReactComponents(
                  pageHeaders.items[0].richSubtitle.json,
                )}
              </div>
            ) : pageHeaders.items[0]?.subtitle ? (
              <p className="text-[14px] font-normal leading-[21px] text-[#F8F7F8]">
                {pageHeaders.items[0].subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <div className="pt-4 sm:pt-6" />
      <ExploreFilters themes={themes.items} />
      <div className="h-4 sm:h-6" />
      <section className="w-full bg-[#F8F7F8]">
        <Suspense>
          <MacroThemeTabs
            dashboards={
              dashboardsPosts.postCollection.total > 0
                ? Array(dashboardsPosts.postCollection.total).fill(undefined)
                : []
            }
            datastories={
              datastoriesPosts.postCollection.total > 0
                ? Array(datastoriesPosts.postCollection.total).fill(undefined)
                : []
            }
            publicacoes={
              boletinsPosts.postCollection.total > 0
                ? Array(boletinsPosts.postCollection.total).fill(undefined)
                : []
            }
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
