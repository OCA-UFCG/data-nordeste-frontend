import { PostsGrid } from "@/components/PostsGrid/PostsGrid";
import HubTemplate from "@/templates/HubTemplate";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getTotalPages } from "@/utils/functions";

export const revalidate = 60;

export default async function DataPanel({}: {}) {
  const pages = (await getTotalPages(POSTS_PER_PAGE)) || 1;

  return (
    <HubTemplate>
      <PostsGrid totalPages={pages} />
    </HubTemplate>
  );
}
