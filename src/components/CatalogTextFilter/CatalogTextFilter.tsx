"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

const CATALOG_FILTER_DELAY_MS = 300;

/**
 * Filters Zenodo catalog records while preserving the active URL filters.
 * @example <CatalogTextFilter />
 */
export function CatalogTextFilter() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const pendingUpdate = useRef<ReturnType<typeof setTimeout>>();
  const [value, setValue] = useState(params.get("q") ?? "");

  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  useEffect(
    () => () => {
      if (pendingUpdate.current) clearTimeout(pendingUpdate.current);
    },
    [],
  );

  const updateCatalogQuery = (query: string, refreshCurrentQuery = false) => {
    const nextParams = new URLSearchParams(params.toString());
    const normalizedQuery = query.trim();

    if (normalizedQuery) {
      nextParams.set("q", normalizedQuery);
      nextParams.delete("category");
    } else {
      nextParams.delete("q");
    }
    nextParams.delete("page");

    const suffix = nextParams.toString();
    const nextHref = suffix ? `${pathname}?${suffix}` : pathname;
    const currentSuffix = params.toString();
    const currentHref = currentSuffix
      ? `${pathname}?${currentSuffix}`
      : pathname;

    if (refreshCurrentQuery && nextHref === currentHref) {
      router.refresh();

      return;
    }

    router.replace(nextHref);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setValue(query);

    if (pendingUpdate.current) clearTimeout(pendingUpdate.current);
    pendingUpdate.current = setTimeout(
      () => updateCatalogQuery(query),
      CATALOG_FILTER_DELAY_MS,
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pendingUpdate.current) clearTimeout(pendingUpdate.current);

    updateCatalogQuery(value, true);
  };

  return (
    <form
      className="w-full flex-1 rounded-lg bg-[#F8F7F8] px-3 transition-colors focus-within:bg-[#F2F1F2]"
      onSubmit={handleSubmit}
      role="search"
    >
      <label className="sr-only" htmlFor="catalog-text-filter">
        Filtrar dados do catálogo
      </label>
      <div className="flex h-[51px] items-center gap-2 px-2 py-1.5">
        <Search className="size-4 text-[#292829]" aria-hidden="true" />
        <input
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm font-normal leading-5 text-[#292829] outline-none placeholder:text-[#292829]"
          id="catalog-text-filter"
          onChange={handleChange}
          placeholder="Digite sua pesquisa"
          type="text"
          value={value}
        />
      </div>
    </form>
  );
}
