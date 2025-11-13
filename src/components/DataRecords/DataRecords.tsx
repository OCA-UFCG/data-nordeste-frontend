"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FilterForm } from "@/components/PostsGrid/FilterForm";
import { SortSelect } from "@/components/PostsGrid/SortSelect";
import { getZenodoCommunityRecords } from "@/lib/zenodo";
import { RECORDS_PER_PAGE, dataSortingTypes } from "@/utils/constants";
import { FilterGroup, Filters } from "@/utils/interfaces";
import { DataList } from "../DataList/DataList";

export const DataRecords = ({ filters }: { filters: FilterGroup[] }) => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [metadata, setMetadata] = useState([]);

  const currentPage = useMemo(() => Number(params.get("page") || 1), [params]);

  const slugToTitle = useMemo(() => {
    const map: { [slug: string]: string } = {};
    filters.forEach((filter) => {
      filter.options.forEach((opt) => {
        map[opt.slug] = opt.title;
      });
    });

    return map;
  }, [filters]);

  const filtersFromUrl = useMemo((): Filters => {
    const base: Filters = {
      date_gte: params.get("date_gte")
        ? new Date(params.get("date_gte")!)
        : undefined,
      date_lte: params.get("date_lte")
        ? new Date(params.get("date_lte")!)
        : undefined,
      sort: params.get("sort") || undefined,
    };

    filters.forEach(({ type }) => {
      const value = params.get(type);
      if (value) {
        base[type] = value.split(",").filter(Boolean);
      } else {
        base[type] = [];
      }
    });

    return base;
  }, [params, filters]);

  const updateUrl = (newFilters: Filters, page: number = 1) => {
    const urlParams = new URLSearchParams();

    Object.entries(newFilters).forEach(([key, value]) => {
      if (!value) return;

      if (Array.isArray(value) && value.length > 0) {
        urlParams.set(key, value.join(","));
      } else if (value instanceof Date) {
        urlParams.set(key, value.toISOString());
      } else if (typeof value == "string") {
        urlParams.set(key, value);
      }
    });

    if (page > 1) urlParams.set("page", page.toString());

    router.push(urlParams.toString() ? `${pathname}?${urlParams}` : pathname);
  };

  useEffect(() => {
    setLoading(true);
    getZenodoCommunityRecords(currentPage, RECORDS_PER_PAGE, filtersFromUrl)
      .then((res: any) => {
        const recordsFormattedTags = res.records.map((record: any) => ({
          ...record,
          tags: (record.tags || []).map(
            (slug: string) => slugToTitle[slug] || slug,
          ),
        }));

        setMetadata(recordsFormattedTags);
        setPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [currentPage, filtersFromUrl, slugToTitle]);

  const handleSubmit = (formData: Filters) => updateUrl(formData);
  const handleSortChange = (sort: string) =>
    updateUrl({ ...filtersFromUrl, sort });

  const filterGroups = filters.map(({ title, type, options }) => ({
    title,
    type,
    fields: Object.fromEntries(options.map(({ slug, title }) => [slug, title])),
  }));

  return (
    <section className="flex flex-col items-center gap-8 px-6 py-10 w-full max-w-[1440px]">
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
            defaultvalue={filtersFromUrl.sort || ""}
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
      />
    </section>
  );
};
