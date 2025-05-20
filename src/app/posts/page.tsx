import PageHeader from "@/components/PageHeader/PageHeader";
import { Posts } from "@/components/Posts/Posts";
import HubTemplate from "@/templates/HubTemplate";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getContent, getTotalPages } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { Suspense } from "react";

export const revalidate = 60;

export default async function DataPanel({}: {}) {
  const pages = (await getTotalPages(POSTS_PER_PAGE)) || 1;
  const { sectionHead, pageHeaders } = await getContent([
    "sectionHead",
    "pageHeaders",
  ]);

  return (
    <HubTemplate>
      <PageHeader
        content={pageHeaders.find(
          (section: { fields: { id: string } }) =>
            section.fields.id === "posts",
        )}
      />

      <Suspense>
        <Posts
          type="posts"
          header={sectionHead.find(
            (sec: { fields: SectionHeader }) => sec.fields.id == "posts",
          )}
          rootFilter={{ "fields.type[in]": "newsletter,additional-content" }}
          totalPages={pages}
          labeled={true}
        />
      </Suspense>
    </HubTemplate>
  );
}
