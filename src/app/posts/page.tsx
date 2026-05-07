import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IPageHeader, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { POST_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";
import {
  buildPostTypeFields,
  POSTS_ROUTE_POST_TYPES,
} from "@/features/posts/postTypes";

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  sectionHeadCollection: { items: SectionHeader[] };
  themeCollection: { items: MacroTheme[] };
  postCollection: { total: number };
}

export default async function PostsPage() {
  const {
    sectionHeadCollection: sectionHead,
    pageHeadersCollection: pageHeaders,
    themeCollection: themes,
    postCollection: pages,
  }: IPostsContent = await getContent(POST_PAGE_QUERY, {
    header_id: "posts",
    head_id: "posts-content",
  });

  return (
    <HubTemplate>
      <PageHeader content={pageHeaders.items[0]} />
      <Suspense>
        <Posts
          header={sectionHead.items[0]}
          rootFilter={{
            type_in: POSTS_ROUTE_POST_TYPES,
          }}
          totalPages={pages.total || 1}
          filterGroups={[
            {
              title: "Tipo de publicação",
              type: "type_in",
              fields: buildPostTypeFields(POSTS_ROUTE_POST_TYPES),
            },
            {
              title: "Categorias dos painéis",
              type: "category",
              fields: Object.fromEntries(
                themes.items.map((theme) => [theme.sys.id, theme.name]),
              ),
            },
          ]}
        />
      </Suspense>
    </HubTemplate>
  );
}
