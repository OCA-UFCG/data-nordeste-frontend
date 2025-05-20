"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { ExploreForm } from "../PostsGrid/ExploreForm";
import { PostsGrid } from "../PostsGrid/PostsGrid";
import { IPublication, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  exploreFilterMap,
  POSTS_PER_PAGE,
  sortingTypes,
} from "@/utils/constants";
import { createQueryString, getPosts, getTotalPages } from "@/utils/functions";
import { SortSelect } from "../PostsGrid/SortSelect";

export const Posts = ({
  header,
  type,
  categories = [],
  totalPages,
  rootFilter = {},
}: {
  header: { fields: SectionHeader };
  type: "posts" | "panels";
  categories?: { fields: MacroTheme; sys: { id: string } }[];
  totalPages: number;
  rootFilter?: { [key: string]: string };
}) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [pages, setpages] = useState(totalPages);
  const [sorting, setSorting] = useState(
    params.get(`sort`) || sortingTypes["Mais recente"],
  );
  const [posts, setPosts] = useState<{ fields: IPublication }[]>([]);
  const [filter, setFilter] = useState<{
    [key: string]: string[] | string | Date | undefined;
  }>({
    category: params.get(`category`)?.split(`,`) || [],
    initDate: Date.parse(params.get(`initDate`) || "")
      ? new Date(params.get(`initDate`) || "")
      : undefined,
    finalDate: Date.parse(params.get(`finalDate`) || "")
      ? new Date(params.get(`finalDate`) || "")
      : undefined,
  });

  const currentPage = useMemo(() => {
    const paramPages = Number(params.get("page") || 1);

    return pages >= paramPages ? paramPages : 1;
  }, [params, pages]);

  const parseForm = (currentForm: {
    [key: string]: string | string[] | Date | undefined;
  }) => {
    const finalForm: { [key: string]: string | string[] } = {};
    const newParams: { [key: string]: string } = {};

    Object.entries(currentForm).map(
      ([key, value]: [string, string | string[] | Date | undefined]) => {
        if (value && key in exploreFilterMap) {
          const formatedValue = exploreFilterMap[key].formatFunc(value);

          if (formatedValue) {
            newParams[key] = formatedValue;
            finalForm[exploreFilterMap[key].name] = formatedValue;
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

    const postsPromise = new Promise((resolve) => {
      resolve(
        getPosts(sorting, currentPage, POSTS_PER_PAGE, {
          ...rootFilter,
          ...parseForm(filter),
        }),
      );
    }).then((value) => {
      setPosts(value as unknown as { fields: IPublication }[]);
    });

    const pagesPromise = new Promise((resolve) => {
      resolve(getTotalPages({ ...rootFilter, ...parseForm(filter) }));
    }).then((value) => {
      setpages(value as number);
    });

    Promise.all([postsPromise, pagesPromise]).then(() => {
      setLoading(false);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pages, sorting, filter]);

  return (
    <section className="flex flex-col items-center gap-4 box-border w-full max-w-[1440px] px-6 py-16 lg:px-20 border-box">
      <div className="flex justify-between items-center w-full">
        <h1 className="text-3xl font-semibold">{header.fields.title}</h1>
        <div className="flex items-center gap-4">
          <ExploreForm
            type={type}
            initSchema={filter}
            onReset={() => setFilter({})}
            categories={categories}
            onSubmit={(newForm) => setFilter(newForm)}
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
