"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ExploreForm } from "../PostsGrid/ExploreForm";
import { PostsGrid } from "../PostsGrid/PostsGrid";
import { IPublication, MacroTheme, SectionHeader } from "@/utils/interfaces";
import { useSearchParams } from "next/navigation";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { getPosts, getTotalPages } from "@/utils/functions";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";

export const Posts = ({
  header,
  categories,
  totalPages,
  rootFilter = {},
}: {
  header: { fields: SectionHeader };
  categories: { fields: MacroTheme; sys: { id: string } }[];
  totalPages: number;
  rootFilter: { [key: string]: string };
}) => {
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const currentPage = useMemo(() => Number(params.get("page")) || 1, [params]);
  const [pages, setpages] = useState(totalPages);
  const [posts, setPosts] = useState<{ fields: IPublication }[]>([]);
  const [filter, setFilter] = useState<{ [key: string]: string }>(rootFilter);
  const [sorting, setSorting] = useState("Data de publicação");

  useEffect(() => {
    setLoading(true);

    const postsPromise = new Promise((resolve) => {
      resolve(getPosts(sorting, currentPage, POSTS_PER_PAGE, filter));
    }).then((value) => {
      console.log(value);
      setPosts(value as unknown as { fields: IPublication }[]);
    });

    const pagesPromise = new Promise((resolve) => {
      resolve(getTotalPages(filter));
    }).then((value) => {
      setpages(value as number);
    });

    Promise.all([postsPromise, pagesPromise]).then(() => {
      setLoading(false);
    });
  }, [currentPage, pages, sorting, filter]);

  return (
    <section className="w-full">
      <div>
        <h1 className="text-3xl font-semibold">{header.fields.title}</h1>
        <div className="">
          <ExploreForm
            categories={categories}
            onSubmit={(newForm) => setFilter({ ...newForm, ...rootFilter })}
          />
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button>hey</Button>
        </PopoverTrigger>
        <PopoverContent>
          <p>testinggg</p>
        </PopoverContent>
      </Popover>
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
