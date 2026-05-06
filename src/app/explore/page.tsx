import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IPageHeader, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { EXPLORE_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  sectionHeadCollection: { items: SectionHeader[] };
  themeCollection: { items: MacroTheme[] };
  postCollection: { total: number };
}

export default async function DataPanel({}: {}) {
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
          categories={{
            title: "Categorias dos painéis",
            type: "category",
            fields: Object.fromEntries(
              themes.items.map((theme) => [theme.sys.id, theme.name]),
            ),
          }}
          header={sectionHead.items[0]}
          rootFilter={{
            type_in: [
              "data-panel",
              "newsletter",
              "additional-content",
              "data-story",
            ],
          }}
          totalPages={pages.total || 1}
        />
      </Suspense>
    </HubTemplate>
  );
}
