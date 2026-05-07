import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IPageHeader, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { POST_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";

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
            type_in: ["newsletter", "additional-content", "data-story"],
          }}
          totalPages={pages.total || 1}
          filterGroups={[
            {
              title: "Tipo de publicação",
              type: "type_in",
              fields: {
                "additional-content": "Notícia",
                "newsletter": "Boletim",
                "data-story": "DataStories",
              },
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
