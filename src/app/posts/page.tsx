import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import { getTotalPages } from "@/utils/functions";
import { IPageHeader, SectionHeader } from "@/utils/interfaces";
import { POST_PAGE_QUERY } from "@/utils/queries";
import { Suspense } from "react";

export const revalidate = 60;

// [
//     "sectionHead",
//     "pageHeaders",

interface IPostsContent {
  pageHeadersCollection: { items: IPageHeader[] };
  sectionHeadCollection: { items: SectionHeader[] };
}

export default async function DataPanel({}: {}) {
  const pages = (await getTotalPages(POSTS_PER_PAGE)) || 1;

  const {
    sectionHeadCollection: sectionHead,
    pageHeadersCollection: pageHeaders,
  }: IPostsContent = await getContent(POST_PAGE_QUERY);

  return (
    <HubTemplate>
      <PageHeader content={pageHeaders.items[0]} />

      <Suspense>
        <Posts
          header={sectionHead.items[0]}
          rootFilter={{ type_in: ["newsletter", "additional-content"] }}
          totalPages={pages}
          categories={{
            title: "Tipo de publicação",
            type: "type_in",
            fields: {
              "additional-content": "Notícia",
              newsletter: "Boletim",
            },
          }}
        />
      </Suspense>
    </HubTemplate>
  );
}
