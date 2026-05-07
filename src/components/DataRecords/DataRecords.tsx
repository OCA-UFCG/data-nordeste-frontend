"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FilterForm } from "@/components/PostsGrid/FilterForm";
import { SortSelect } from "@/components/PostsGrid/SortSelect";
import { getZenodoCommunityRecords } from "@/lib/zenodo";
import { RECORDS_PER_PAGE, dataSortingTypes } from "@/utils/constants";
import {
  FilterGroup,
  Filters,
  IMetadata,
  MacroTheme,
} from "@/utils/interfaces";
import { DataList } from "../DataList/DataList";
import { applyCatalogFilterLabels } from "@/features/catalog/records";
import {
  buildCatalogFilterGroups,
  buildCatalogFilterValues,
  buildCatalogSlugTitleMap,
  buildCatalogUrlParams,
} from "@/features/catalog/filters";

export const DataRecords = ({
  filters,
  themes,
  initialRecords,
  initialTotalPages,
}: {
  filters: FilterGroup[];
  themes: MacroTheme[];
  initialRecords: IMetadata[];
  initialTotalPages: number;
}) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState(initialTotalPages);
  const [metadata, setMetadata] = useState<IMetadata[]>(initialRecords);

  const currentPage = useMemo(() => Number(params.get("page") || 1), [params]);

  const slugToTitle = useMemo(
    () => buildCatalogSlugTitleMap(filters),
    [filters],
  );

  const filtersFromUrl = useMemo((): Filters => {
    return buildCatalogFilterValues(params, filters);
  }, [params, filters]);
  const initialRequestKey = useRef(
    JSON.stringify({
      currentPage,
      filtersFromUrl,
    }),
  );

  const updateUrl = (newFilters: Filters, page: number = 1) => {
    const urlParams = buildCatalogUrlParams(newFilters, page);

    router.push(urlParams.toString() ? `${pathname}?${urlParams}` : pathname);
  };

  useEffect(() => {
    const requestKey = JSON.stringify({
      currentPage,
      filtersFromUrl,
    });

    if (requestKey === initialRequestKey.current) return;

    setLoading(true);
    getZenodoCommunityRecords(currentPage, RECORDS_PER_PAGE, filtersFromUrl)
      .then((res) => {
        const recordsFormattedTags: IMetadata[] = applyCatalogFilterLabels(
          res.records,
          slugToTitle,
        );

        setMetadata(recordsFormattedTags);
        setPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [currentPage, filtersFromUrl, slugToTitle]);

  const handleSubmit = (formData: Filters) => updateUrl(formData);
  const handleSortChange = (sort: string) =>
    updateUrl({ ...filtersFromUrl, sort });

  const filterGroups = buildCatalogFilterGroups(filters);

  return (
    <section className="flex flex-col items-center gap-8 w-full max-w-[1440px] mx-auto px-6 sm:px-10 md:px-10 lg:px-20 py-4">
      <div className="flex flex-col lg:flex-row justify-between items-center w-full gap-4">
        <h2 className="text-3xl font-semibold mr-auto">Listagem dos dados</h2>
        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto justify-end">
          <FilterForm
            initSchema={filtersFromUrl}
            filterGroups={filterGroups}
            onSubmit={handleSubmit}
            onReset={() => router.push(pathname)}
            layout="horizontal"
          />
          <SortSelect
            defaultValue={filtersFromUrl.sort || ""}
            onChange={handleSortChange}
            sortingTypes={dataSortingTypes}
          />
        </div>
      </div>

      <DataList
        posts={metadata}
        pages={pages}
        currentPage={currentPage}
        loading={loading}
        themes={themes}
      />
    </section>
  );
};
