import { useMemo } from "react";
import { PAGINATION_SIZE } from "./constants";

export const capitalize = (inputString: string): string => {
  return inputString
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const sortContentByDesiredOrder = <T extends { id: string }>(
  content: T[],
  desiredOrder: string[],
): T[] => {
  return [...content].sort((a, b) => {
    const aIndex = desiredOrder.indexOf(a.id);
    const bIndex = desiredOrder.indexOf(b.id);

    return (
      (aIndex === -1 ? Infinity : aIndex) - (bIndex === -1 ? Infinity : bIndex)
    );
  });
};

export const createQueryString = (newParams: { [key: string]: string }) => {
  const searchParams = new URLSearchParams();

  Object.entries(newParams).forEach(([name, value]) => {
    searchParams.set(name, value);
  });

  return searchParams.toString();
};

export const isHrefActive = (
  pathname: string,
  category: string | null,
  href?: string | null,
): boolean => {
  if (!href) return false;

  const [hrefPath, hrefQuery] = href.split("?");
  const hrefParams = new URLSearchParams(hrefQuery).get("category");

  return pathname === hrefPath && hrefParams === category;
};

export const usePaginationRange = (currentPage: number, totalPages: number) => {
  return useMemo(() => {
    let init = 0;
    let end = totalPages;

    if (totalPages >= PAGINATION_SIZE) {
      init = currentPage - PAGINATION_SIZE;
      end = currentPage + PAGINATION_SIZE;

      if (currentPage + PAGINATION_SIZE > totalPages) {
        init = totalPages - PAGINATION_SIZE;
        end = totalPages;
      } else if (currentPage - PAGINATION_SIZE <= 0) {
        init = 0;
        end = PAGINATION_SIZE;
      }
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1).slice(init, end);
  }, [currentPage, totalPages]);
};

export const normalizeKey = (value?: string) =>
  value
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .toLowerCase() ?? "";
