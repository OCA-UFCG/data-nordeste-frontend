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
import {
  createQueryString,
  getEntriesByType,
  getTotalPages,
} from "@/utils/functions";
import { SortSelect } from "../PostsGrid/SortSelect";

export const Posts = ({
  header,
  categories,
  totalPages,
  rootFilter = {},
}: {
  header: { fields: SectionHeader };
  categories: {
    title: string;
    type: string;
    fields: { [key: string]: string };
  };
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
  const filter = useMemo(
    () => ({
      category: params.get("category")?.split(",") || [],
      initDate: Date.parse(params.get(`initDate`) || "")
        ? new Date(params.get(`initDate`) || "")
        : undefined,
      finalDate: Date.parse(params.get(`finalDate`) || "")
        ? new Date(params.get(`finalDate`) || "")
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
        getEntriesByType<IPublication>(sorting, currentPage, POSTS_PER_PAGE, {
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
      <div className="flex flex-col lg:flex-row justify-between lg:items-center w-full gap-4">
        <h1 className="text-3xl font-semibold w-full">{header.fields.title}</h1>
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
