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

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={totalPages === 0 || currentPage <= 1}
            href={`?page=${currentPage - 1}`}
          />
        </PaginationItem>

        {pagesRange.map((i) =>
          loading ? (
            <Skeleton key={i} className="w-[40px] h-[40px] rounded-lg" />
          ) : (
            <PaginationItem key={i}>
              <PaginationLink isActive={i === currentPage} href={`?page=${i}`}>
                {i}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationNext
            disabled={totalPages === 0 || currentPage >= totalPages}
            href={`?page=${currentPage + 1}`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
