import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { REVALIDATE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import { IPageHeader, SectionHeader } from "@/utils/interfaces";
import { POST_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";

export const revalidate = REVALIDATE;

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  sectionHeadCollection: { items: SectionHeader[] };
  postCollection: { total: number };
}

export default async function DataPanel({}: {}) {
  const {
    sectionHeadCollection: sectionHead,
    pageHeadersCollection: pageHeaders,
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
            type_in: [
              "newsletter",
              "additional-content",
              "data-panel",
              "data-story",
            ],
          }}
          totalPages={pages.total || 1}
          categories={{
            title: "Tipo de publicação",
            type: "type_in",
            fields: {
              "additional-content": "Notícia",
              "newsletter": "Boletim",
              "data-panel": "Dashboard",
              "data-story": "DataStories",
            },
          }}
        />
      </Suspense>
    </HubTemplate>
  );
}
