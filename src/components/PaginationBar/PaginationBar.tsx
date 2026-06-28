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
import { useExploreNavigation } from "@/features/explore/navigation";

export const PaginationBar = ({
  currentPage,
  totalPages,
  loading,
  clientSideNavigation = false,
}: {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  clientSideNavigation?: boolean;
}) => {
  const pagesRange = usePaginationRange(currentPage, totalPages);
  const searchParams = useSearchParams();
  const { pushQuery } = useExploreNavigation();

  const navigateToPage = (page: number) => {
    if (!clientSideNavigation) return;
    pushQuery({ page: page.toString() });
  };

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
            onClick={(event) => {
              if (!clientSideNavigation) return;
              event.preventDefault();
              navigateToPage(currentPage - 1);
            }}
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
                onClick={(event) => {
                  if (!clientSideNavigation) return;
                  event.preventDefault();
                  navigateToPage(i);
                }}
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
            onClick={(event) => {
              if (!clientSideNavigation) return;
              event.preventDefault();
              navigateToPage(currentPage + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
