"use client";

import { PostsGrid } from "../PostsGrid/PostsGrid";
import { IPublication } from "@/utils/interfaces";
import { useSearchParams } from "next/navigation";
import { parsePostsQueryState } from "@/features/posts/filters";

export const Posts = ({
  totalPages,
  posts,
}: {
  totalPages: number;
  posts: IPublication[];
}) => {
  const params = useSearchParams();

  // PERF: pagination links re-render /posts on the server, which already
  // fetches this page through the data cache. Rendering the props avoids a
  // second, uncached Contentful call from the browser on every page change.
  const { currentPage, filter } = parsePostsQueryState(
    new URLSearchParams(params.toString()),
    totalPages,
  );

  return (
    <section className="w-full bg-[#F8F7F8] py-9">
      <div className="flex flex-col items-center gap-12 w-full max-w-[1440px] mx-auto px-4 sm:px-20">
        <PostsGrid
          currentPage={currentPage}
          pages={totalPages}
          posts={posts}
          loading={false}
          searchQuery={filter.q as string}
        />
      </div>
    </section>
  );
};
