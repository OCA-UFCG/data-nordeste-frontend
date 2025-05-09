import { PostsGrid } from "@/components/PostsGrid/PostsGrid";
import HubTemplate from "@/templates/HubTemplate";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getContent, getTotalPages } from "@/utils/functions";
import { SectionHeader } from "@/utils/interfaces";
import { Suspense } from "react";

export const revalidate = 60;

export default async function DataPanel({}: {}) {
  const pages = (await getTotalPages(POSTS_PER_PAGE)) || 1;
  const { sectionHead } = await getContent(["sectionHead"]);

  return (
    <HubTemplate>
      <Suspense>
        <PostsGrid
          header={sectionHead.find(
            (sec: { fields: SectionHeader }) =>
              sec.fields.id == "interactive-panels",
          )}
          initFilter={{ "fields.type[in]": "data-panel" }}
          totalPages={pages}
        />
      </Suspense>
    </HubTemplate>
  );
}
