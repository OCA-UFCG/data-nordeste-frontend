"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { FilterForm } from "../PostsGrid/FilterForm";
import { PostsGrid } from "../PostsGrid/PostsGrid";
import { IPublication, SectionHeader } from "@/utils/interfaces";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { sortingTypes } from "@/utils/constants";
import { SortSelect } from "../PostsGrid/SortSelect";
import { getContent } from "@/utils/contentful";
import { PUBLICATION_QUERY } from "@/utils/queries";
import {
  buildPostsContentfulFilter,
  buildPostsSkip,
  buildPostsTotalPages,
  buildPostsUrlQuery,
  parsePostsQueryState,
  PostsFilterForm,
} from "@/features/posts/filters";
import { FilterFormGroup } from "@/features/filters/form";

export const Posts = ({
  header,
  categories,
  filterGroups,
  totalPages,
  initialPosts,
  rootFilter = {},
}: {
  header: SectionHeader;
  totalPages: number;
  initialPosts: IPublication[];
  rootFilter?: { [key: string]: string | string[] };
} & (
  | { categories: FilterFormGroup; filterGroups?: never }
  | { filterGroups: FilterFormGroup[]; categories?: never }
)) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const paramsKey = params.toString();

  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(totalPages);
  const [sorting, setSorting] = useState(
    params.get(`sort`) || sortingTypes["Mais recente"],
  );
  const [posts, setPosts] = useState<IPublication[]>(initialPosts);
  const queryState = useMemo(() => {
    const searchParams = new URLSearchParams(paramsKey);

    return parsePostsQueryState(searchParams, pages);
  }, [pages, paramsKey]);

  const syncUrlFromForm = (currentForm: PostsFilterForm) => {
    router.replace(
      pathname + "?" + buildPostsUrlQuery(currentForm, currentPage),
    );
  };

  const { currentPage, filter } = queryState;
  const initialRequestKey = useRef(
    JSON.stringify({
      currentPage,
      filter,
      sorting,
      rootFilter,
    }),
  );

  useEffect(() => {
    const requestKey = JSON.stringify({
      currentPage,
      filter,
      sorting,
      rootFilter,
    });

    if (requestKey === initialRequestKey.current) return;

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
      const { postCollection: posts } = value;
      setPosts(posts.items);
      setPages(buildPostsTotalPages(posts.total));
      setLoading(false);
    });
  }, [currentPage, filter, rootFilter, sorting]);

  return (
    <section className="flex flex-col items-center gap-4 box-border w-full max-w-[1440px] px-6 py-16 lg:px-20 border-box">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center w-full gap-4">
        <h1 className="text-3xl font-semibold w-full">{header.title}</h1>
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
          <FilterForm
            initSchema={filter}
            {...(filterGroups
              ? { filterGroups }
              : { selectFields: categories })}
            onReset={() => router.push(pathname)}
            onSubmit={(newForm) => syncUrlFromForm(newForm)}
          />
          <SortSelect defaultValue={sorting} onChange={setSorting} />
        </div>
      </div>
      <Suspense>
        <PostsGrid
          pages={pages}
          currentPage={currentPage}
          loading={loading}
          posts={posts}
        />
      </Suspense>
    </section>
  );
};
