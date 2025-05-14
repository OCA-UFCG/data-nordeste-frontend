"use client";

import { IPublication } from "@/utils/interfaces";
import ContentPost from "../ContentPost/ContentPost";
import { useEffect, useMemo, useState } from "react";
import { getPosts, getTotalPages } from "@/utils/functions";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { SortMenu } from "../SortMenu/SortMenu";
import { FilterMenu } from "../FilterMenu/FilterMenu";
import { Icon } from "../Icon/Icon";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

const PAGINATION_SIZE = 3;

export const PostsGrid = ({
  header,
  totalPages,
  initFilter = {},
  labeled = false,
}: {
  totalPages: number;
  header: { fields: any };
  initFilter?: { [key: string]: string };
  labeled?: boolean;
}) => {
  const params = useSearchParams();
  const currentPage = useMemo(() => Number(params.get("page")) || 1, [params]);
  const [pages, setpages] = useState(totalPages);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{ [x: string]: string }>(initFilter);
  const [sorting, setSorting] = useState("Data de publicação");
  const [posts, setPosts] = useState<{ fields: IPublication }[]>([]);

  const pagesRange = useMemo(() => {
    let init = 0;
    let end = pages;

    if (pages >= PAGINATION_SIZE) {
      init = currentPage - PAGINATION_SIZE;
      end = currentPage + PAGINATION_SIZE;

      if (currentPage + PAGINATION_SIZE > pages) {
        init = pages - PAGINATION_SIZE;
        end = pages;
      } else if (currentPage - PAGINATION_SIZE <= 0) {
        init = 0;
        end = PAGINATION_SIZE;
      }
    }

    return Array.from({ length: pages }, (_, i) => i + 1).slice(init, end);
  }, [currentPage, pages]);

  useEffect(() => {
    setLoading(true);

    const postsPromise = new Promise((resolve) => {
      resolve(getPosts(sorting, currentPage, POSTS_PER_PAGE, filter));
    }).then((value) => {
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
    <div className="grow-1 flex flex-col items-center gap-8 w-full p-4 max-w-[1440px] box-border py-16">
      <div className="flex flex-col md:flex-row w-full gap-4 justify-between">
        <h1 className="text-3xl font-semibold">{header.fields.title}</h1>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <FilterMenu onSubmit={(form) => setFilter(form)} />
          <SortMenu onClick={(sortType: string) => setSorting(sortType)} />
        </div>
      </div>
      <div
        className={cn(
          !loading && posts.length == 0 ? "flex" : "grid",
          "grow-1 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full justify-center gap-6",
        )}
      >
        {loading ? (
          [...Array(POSTS_PER_PAGE)].map((_, i) => (
            <Skeleton className="w-full h-[250px] rounded-lg" key={i} />
          ))
        ) : posts.length > 0 ? (
          posts.map((post, i) => (
            <ContentPost content={post} key={i} labeled={labeled} />
          ))
        ) : (
          <div className="grow-1 flex flex-col gap-4 justify-center items-center w-full py-12 bg-gray-50 rounded-lg">
            <Icon id="no-mail" size={48} />
            <span>Nenhum post encontrado</span>
          </div>
        )}
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              disabled={currentPage <= 1}
              href={`/explore?page=${currentPage - 1}`}
            />
          </PaginationItem>
          {pagesRange.map((i) =>
            loading ? (
              <Skeleton className="w-[40px] h-[40px] rounded-lg" key={i} />
            ) : (
              <PaginationItem key={i}>
                <PaginationLink
                  isActive={i == currentPage}
                  href={`/explore?page=${i}`}
                >
                  {i}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              disabled={currentPage >= pages}
              href={`/explore?page=${currentPage + 1}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
