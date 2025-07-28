import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { POSTS_PER_PAGE, REVALIDATE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import { getTotalPages } from "@/utils/functions";
import { IPageHeader, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { EXPLORE_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";

export const revalidate = REVALIDATE;

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  sectionHeadCollection: { items: SectionHeader[] };
  themeCollection: { items: MacroTheme[] };
}

export default async function DataPanel({}: {}) {
  const pages = (await getTotalPages(POSTS_PER_PAGE)) || 1;

  const {
    sectionHeadCollection: sectionHead,
    pageHeadersCollection: pageHeaders,
    themeCollection: themes,
  }: IPostsContent = await getContent(EXPLORE_PAGE_QUERY, {
    header_id: "panels",
    head_id: "interactive-panels",
  });

  console.log(themes.items.map((theme) => [theme.sys.id, theme.name]));
  console.log(
    Object.fromEntries(themes.items.map((theme) => [theme.sys.id, theme.name])),
  );

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
          rootFilter={{ type_in: ["data-panel"] }}
          totalPages={pages}
        />
      </Suspense>
    </HubTemplate>
  );
}
