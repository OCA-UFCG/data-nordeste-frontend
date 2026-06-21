"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FilterGroup, IMetadata, MacroTheme } from "@/utils/interfaces";
import { DataList } from "../DataList/DataList";
import {
  buildCatalogFilterValues,
  buildCatalogSlugTitleMap,
} from "@/features/catalog/filters";
import { filterCatalogRecords } from "@/features/catalog/records";
import { RECORDS_PER_PAGE } from "@/utils/constants";

export const DataRecords = ({
  filters,
  themes,
  initialRecords,
}: {
  filters: FilterGroup[];
  themes: MacroTheme[];
  initialRecords: IMetadata[];
}) => {
  const params = useSearchParams();

  const currentPage = useMemo(() => Number(params.get("page") || 1), [params]);

  const filtersFromUrl = useMemo(() => {
    return buildCatalogFilterValues(params, filters);
  }, [params, filters]);
  const slugToTitle = useMemo(
    () => buildCatalogSlugTitleMap(filters),
    [filters],
  );
  const filteredRecords = useMemo(
    () => filterCatalogRecords(initialRecords, filtersFromUrl, slugToTitle),
    [filtersFromUrl, initialRecords, slugToTitle],
  );
  const pages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const visibleRecords = filteredRecords.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE,
  );

  return (
    <section className="flex flex-col items-center w-full max-w-[1440px] mx-auto px-6 sm:px-10 md:px-10 lg:px-20 py-4">
      <DataList
        posts={visibleRecords}
        pages={pages}
        currentPage={currentPage}
        loading={false}
        themes={themes}
      />
    </section>
  );
};
