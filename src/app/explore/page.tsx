import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import {
  IPageHeader,
  IPublication,
  MacroTheme,
  SectionHeader,
} from "@/utils/interfaces";
import { EXPLORE_PAGE_QUERY, PUBLICATION_QUERY } from "@/utils/queries";
import { Suspense } from "react";
import type { Metadata } from "next";
import {
  buildPostTypeFields,
  EXPLORE_ROUTE_POST_TYPES,
} from "@/features/posts/postTypes";
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

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  sectionHeadCollection: { items: SectionHeader[] };
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
  const rootFilter = {
    type_in: EXPLORE_ROUTE_POST_TYPES,
  };
  const initialQueryState = parsePostsQueryState(
    urlSearchParams,
    Number.MAX_SAFE_INTEGER,
  );
  const {
    sectionHeadCollection: sectionHead,
    pageHeadersCollection: pageHeaders,
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

  return (
    <HubTemplate>
      <PageHeader content={pageHeaders.items[0]} />
      <Suspense>
        <Posts
          filterGroups={[
            {
              title: "Tipo de publicação",
              type: "type_in",
              fields: buildPostTypeFields(EXPLORE_ROUTE_POST_TYPES),
            },
            {
              title: "Categorias dos painéis",
              type: "category",
              fields: Object.fromEntries(
                themes.items.map((theme) => [theme.sys.id, theme.name]),
              ),
            },
          ]}
          header={sectionHead.items[0]}
          rootFilter={rootFilter}
          totalPages={totalPages || 1}
          initialPosts={initialPosts.items}
        />
      </Suspense>
    </HubTemplate>
  );
}
