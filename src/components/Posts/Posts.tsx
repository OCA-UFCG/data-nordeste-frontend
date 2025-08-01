"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { FilterForm } from "../PostsGrid/FilterForm";
import { PostsGrid } from "../PostsGrid/PostsGrid";
import { IPublication, SectionHeader } from "@/utils/interfaces";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  exploreFilterMap,
  POSTS_PER_PAGE,
  sortingTypes,
} from "@/utils/constants";
import { createQueryString } from "@/utils/functions";
import { SortSelect } from "../PostsGrid/SortSelect";
import { getContent } from "@/utils/contentful";
import { PUBLICATION_QUERY } from "@/utils/queries";

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

  const [loading, setLoading] = useState(true);
  const [pages, setpages] = useState(totalPages);
  const [sorting, setSorting] = useState(
    params.get(`sort`) || sortingTypes["Mais recente"],
  );
  const [posts, setPosts] = useState<IPublication[]>([]);
  const filter = useMemo(
    () => ({
      type_in: params.get("type_in")?.split(",") || undefined,
      category: params.get("category")?.split(",") || [],
      date_lte: Date.parse(params.get(`date_lte`) || "")
        ? new Date(params.get(`date_lte`) || "")
        : undefined,
      date_gte: Date.parse(params.get(`date_gte`) || "")
        ? new Date(params.get(`date_gte`) || "")
        : undefined,
    }),
    [params],
  );

  const currentPage = useMemo(() => {
    const paramPages = Number(params.get("page") || 1);

    return pages >= paramPages ? paramPages : 1;
  }, [params, pages]);

  const parseForm = (currentForm: {
    [key: string]: string | string[] | Date | undefined;
  }) => {
    let finalForm: { [key: string]: string | string[] } = {};
    let newParams: { [key: string]: string } = {};

    Object.entries(currentForm).map(
      ([key, value]: [string, string | string[] | Date | undefined]) => {
        if (value && key in exploreFilterMap) {
          const formatedParam = exploreFilterMap[key].formatParam(value);
          if (formatedParam[key]) {
            newParams = { ...newParams, ...{ [key]: formatedParam[key] } };
          }

          const formatedForm = exploreFilterMap[key].formatForm(value);
          if (formatedForm[key]) {
            finalForm = {
              ...finalForm,
              ...{ [key]: formatedForm[key] },
            };
          }
        }
      },
    );

    router.push(
      pathname +
        "?" +
        createQueryString({ ...newParams, page: currentPage.toString() }),
    );

    return finalForm;
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
            ...parseForm(filter),
          },
        }),
      );
    }).then((value) => {
      const { postCollection: posts } = value;
      setPosts(posts.items);
      setpages(Math.ceil(posts.total / POSTS_PER_PAGE));
      setLoading(false);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, rootFilter, sorting]);

  return (
    <section className="flex flex-col items-center gap-4 box-border w-full max-w-[1440px] px-6 py-16 lg:px-20 border-box">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center w-full gap-4">
        <h1 className="text-3xl font-semibold w-full">{header.title}</h1>
        <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
          <FilterForm
            initSchema={filter}
            selectFields={categories}
            onReset={() => router.push(pathname)}
            onSubmit={(newForm) => parseForm(newForm)}
          />
          <SortSelect defaultvalue={sorting} onChange={setSorting} />
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
