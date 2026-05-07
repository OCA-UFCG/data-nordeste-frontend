"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import { Skeleton } from "../ui/skeleton";
import { usePaginationRange } from "@/utils/functions";
import { useSearchParams } from "next/navigation";

export const PaginationBar = ({
  currentPage,
  totalPages,
  loading,
}: {
  currentPage: number;
  totalPages: number;
  loading: boolean;
}) => {
  const pagesRange = usePaginationRange(currentPage, totalPages);
  const searchParams = useSearchParams();

  const buildPageHref = (page: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("page", page.toString());

    return `?${nextParams.toString()}`;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={totalPages === 0 || currentPage <= 1}
            href={buildPageHref(currentPage - 1)}
          />
        </PaginationItem>

        {pagesRange.map((i) =>
          loading ? (
            <Skeleton key={i} className="w-[40px] h-[40px] rounded-lg" />
          ) : (
            <PaginationItem key={i}>
              <PaginationLink
                isActive={i === currentPage}
                href={buildPageHref(i)}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            disabled={totalPages === 0 || currentPage >= totalPages}
            href={buildPageHref(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
