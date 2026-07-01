import { ExploreFilters } from "@/components/ExploreFilters/ExploreFilters";
import { ExploreResults } from "@/components/ExploreResults/ExploreResults";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IPageHeader, MacroTheme } from "@/utils/interfaces";
import { EXPLORE_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { fetchExploreResults } from "@/features/explore/results";

export const metadata: Metadata = buildMetadata({
  title: "Explorar",
  description:
    "Explore paineis interativos, datastories e experiencias de dados sobre desenvolvimento regional no Nordeste.",
  path: "/explore",
});

const TAB_HEADERS_IDS: Record<string, string> = {
  dataPanels: "dashboards",
  dataNarrative: "datastories",
  publications: "publications",
};

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  tabHeadersCollection: { items: IPageHeader[] };
  themeCollection: { items: MacroTheme[] };
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

  const [pageContent, initialResults] = await Promise.all([
    getContent<IPostsContent>(EXPLORE_PAGE_QUERY, {
      header_id: "panels",
    }),
    fetchExploreResults(urlSearchParams),
  ]);
  const {
    pageHeadersCollection: pageHeaders,
    tabHeadersCollection: tabHeaders,
    themeCollection: themes,
  } = pageContent;

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
          <div className="flex flex-col gap-4 sm:gap-6 w-full max-w-[1280px]">
            <h1 className="text-[30px] sm:text-[48px] font-extrabold leading-[36px] sm:leading-[48px] tracking-[-0.0075em] sm:tracking-[-0.012em] text-[#F8F7F8]">
              {pageHeaders.items[0]?.title}
            </h1>

            {pageHeaders.items[0]?.richSubtitle ? (
              <div className="text-[14px] sm:text-[18px] font-normal sm:font-medium leading-[21px] sm:leading-6 text-[#F8F7F8] [&_p]:m-0">
                {documentToReactComponents(
                  pageHeaders.items[0].richSubtitle.json,
                )}
              </div>
            ) : pageHeaders.items[0]?.subtitle ? (
              <p className="text-[14px] sm:text-[18px] font-normal sm:font-medium leading-[21px] sm:leading-6 text-[#F8F7F8]">
                {pageHeaders.items[0].subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <div className="pt-4 sm:pt-6" />
      <ExploreFilters themes={themes.items} clientSideNavigation />
      <div className="h-4 sm:h-6" />
      <section className="w-full bg-[#F8F7F8]">
        <Suspense>
          <ExploreResults
            headers={{
              dashboards: tabHeadersById.get("dashboards"),
              datastories: tabHeadersById.get("datastories"),
              publications: tabHeadersById.get("publications"),
            }}
            initialResults={initialResults}
          />
        </Suspense>
      </section>
    </HubTemplate>
  );
}
