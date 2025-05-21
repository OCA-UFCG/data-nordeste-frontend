"use client";

import { useMemo } from "react";
import { IPublication } from "@/utils/interfaces";
import ContentPost from "../ContentPost/ContentPost";
import { POSTS_PER_PAGE } from "@/utils/constants";
import { Icon } from "../Icon/Icon";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

const PAGINATION_SIZE = 3;

export const PostsGrid = ({
  currentPage,
  pages,
  posts = [],
  loading,
  labeled = false,
}: {
  currentPage: number;
  loading: boolean;
  pages: number;
  posts: { fields: IPublication }[];
  labeled?: boolean;
}) => {
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

  return (
    <div className="grow-1 flex flex-col items-center gap-8 w-full max-w-[1440px] box-border">
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
              disabled={pages == 0 || currentPage <= 1}
              href={`?page=${currentPage - 1}`}
            />
          </PaginationItem>
          {pagesRange.map((i) =>
            loading ? (
              <Skeleton className="w-[40px] h-[40px] rounded-lg" key={i} />
            ) : (
              <PaginationItem key={i}>
                <PaginationLink isActive={i == currentPage} href={`?page=${i}`}>
                  {i}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              disabled={pages == 0 || currentPage >= pages}
              href={`?page=${currentPage + 1}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
