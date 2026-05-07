"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { FilterForm } from "../PostsGrid/FilterForm";
import { PostsGrid } from "../PostsGrid/PostsGrid";
import { IPublication, SectionHeader } from "@/utils/interfaces";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { POSTS_PER_PAGE, sortingTypes } from "@/utils/constants";
import { createQueryString } from "@/utils/functions";
import { SortSelect } from "../PostsGrid/SortSelect";
import { getContent } from "@/utils/contentful";
import { PUBLICATION_QUERY } from "@/utils/queries";
import { parsePostsFilters, PostsFilterForm } from "@/features/posts/filters";

export const Posts = ({
  header,
  categories,
  totalPages,
  rootFilter = {},
}: {
  header: SectionHeader;
  categories: {
    title: string;
    type: string;
    fields: { [key: string]: string };
  };
  totalPages: number;
  rootFilter?: { [key: string]: string | string[] };
}) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const paramsKey = params.toString();

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(totalPages);
  const [sorting, setSorting] = useState(
    params.get(`sort`) || sortingTypes["Mais recente"],
  );
  const [posts, setPosts] = useState<IPublication[]>([]);
  const filter = useMemo(() => {
    const searchParams = new URLSearchParams(paramsKey);

    return {
      type_in: searchParams.get("type_in")?.split(",") || undefined,
      category: searchParams.get("category")?.split(",") || [],
      date_lte: Date.parse(searchParams.get(`date_lte`) || "")
        ? new Date(searchParams.get(`date_lte`) || "")
        : undefined,
      date_gte: Date.parse(searchParams.get(`date_gte`) || "")
        ? new Date(searchParams.get(`date_gte`) || "")
        : undefined,
    };
  }, [paramsKey]);

  const currentPage = useMemo(() => {
    const searchParams = new URLSearchParams(paramsKey);
    const paramPages = Number(searchParams.get("page") || 1);

    return pages >= paramPages ? paramPages : 1;
  }, [pages, paramsKey]);

  const syncUrlFromForm = (currentForm: PostsFilterForm) => {
    const { urlParams } = parsePostsFilters(currentForm);
    router.replace(
      pathname +
        "?" +
        createQueryString({ ...urlParams, page: currentPage.toString() }),
    );
  };

  useEffect(() => {
    setLoading(true);

    new Promise<{
      postCollection: { total: number; items: IPublication[] };
    }>((resolve) => {
      resolve(
        getContent<{
          postCollection: { total: number; items: IPublication[] };
        }>(PUBLICATION_QUERY, {
          order: sorting,
          skip: POSTS_PER_PAGE * (currentPage - 1),
          filter: {
            ...rootFilter,
            ...parsePostsFilters(filter).contentfulFilter,
          },
        }),
      );
    }).then((value) => {
      const { postCollection: posts } = value;
      setPosts(posts.items);
      setPages(Math.ceil(posts.total / POSTS_PER_PAGE));
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
            selectFields={categories}
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
