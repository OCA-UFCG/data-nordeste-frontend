"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PostsGrid } from "../PostsGrid/PostsGrid";
import { IPublication } from "@/utils/interfaces";
import { useSearchParams } from "next/navigation";
import { sortingTypes } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import { PUBLICATION_QUERY } from "@/utils/queries";
import {
  buildPostsContentfulFilter,
  buildPostsSkip,
  buildPostsTotalPages,
  parsePostsQueryState,
} from "@/features/posts/filters";

export const Posts = ({
  totalPages,
  initialPosts,
  rootFilter = {},
}: {
  totalPages: number;
  initialPosts: IPublication[];
  rootFilter?: { [key: string]: string | string[] };
}) => {
  const params = useSearchParams();
  const paramsKey = params.toString();

  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(totalPages);
  const sorting = params.get("sort") || sortingTypes["Mais recente"];
  const [posts, setPosts] = useState<IPublication[]>(initialPosts);
  const queryState = useMemo(() => {
    const searchParams = new URLSearchParams(paramsKey);

    return parsePostsQueryState(searchParams, pages);
  }, [pages, paramsKey]);

  const { currentPage, filter } = queryState;
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;

      return;
    }

    setLoading(true);

    new Promise<{
      postCollection: { total: number; items: IPublication[] };
    }>((resolve) => {
      resolve(
        getContent<{
          postCollection: { total: number; items: IPublication[] };
        }>(PUBLICATION_QUERY, {
          order: sorting,
          skip: buildPostsSkip(currentPage),
          filter: buildPostsContentfulFilter(filter, rootFilter),
        }),
      );
    }).then((value) => {
      const { postCollection: fetched } = value;

      setPosts(fetched.items);
      setPages(buildPostsTotalPages(fetched.total));
      setLoading(false);
    });
  }, [currentPage, filter, rootFilter, sorting]);

  return (
    <section className="w-full bg-[#F8F7F8] py-9">
      <div className="flex flex-col items-center gap-12 w-full max-w-[1440px] mx-auto px-20">
        <PostsGrid
          currentPage={currentPage}
          pages={pages}
          posts={posts}
          loading={loading}
        />
      </div>
    </section>
  );
};
