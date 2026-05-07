import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IPageHeader, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { EXPLORE_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";
import {
  buildPostTypeFields,
  EXPLORE_ROUTE_POST_TYPES,
} from "@/features/posts/postTypes";

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  sectionHeadCollection: { items: SectionHeader[] };
  themeCollection: { items: MacroTheme[] };
  postCollection: { total: number };
}

export default async function ExplorePage() {
  const {
    sectionHeadCollection: sectionHead,
    pageHeadersCollection: pageHeaders,
    themeCollection: themes,
    postCollection: pages,
  }: IPostsContent = await getContent(EXPLORE_PAGE_QUERY, {
    header_id: "panels",
    head_id: "interactive-panels",
  });

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
          rootFilter={{
            type_in: EXPLORE_ROUTE_POST_TYPES,
          }}
          totalPages={pages.total || 1}
        />
      </Suspense>
    </HubTemplate>
  );
}
