"use client";

import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon/Icon";
import { Button } from "@/components/ui/button";
import {
  MACROTHEME_ICON_BY_ID,
  THEMES_NAVIGATION_ORDER,
} from "@/features/macrothemes/constants";
import { sortingTypes } from "@/utils/constants";
import { sortContentByDesiredOrder } from "@/utils/functions";
import { normalizeKey } from "@/utils/functions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useId, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { SearchIndexItem } from "@/features/search/types";
import { useExploreNavigation } from "@/features/explore/navigation";

import ThemeFilterCard from "./ThemeFilterCard";
import SeeThemesModal from "./SeeThemesModal";
import type { ExploreFiltersProps } from "./types";
import { CatalogTextFilter } from "../CatalogTextFilter/CatalogTextFilter";
import { SearchBar } from "../SearchBar/SearchBar";

export function ExploreFilters({
  className,
  themes,
  categoryValues,
  clientSideNavigation = false,
  mobileCatalogLayout = false,
  sortingOptions = sortingTypes,
}: ExploreFiltersProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mobileThemesId = useId();
  const [mobileThemesOpen, setMobileThemesOpen] = useState(false);
  const [seeThemesModalOpen, setSeeThemesModalOpen] = useState(false);
  const [pendingCategories, setPendingCategories] = useState<string[]>([]);
  const { replaceQuery } = useExploreNavigation();

  const selectedCategories = useMemo(
    () => params.get("category")?.split(",").filter(Boolean) ?? [],
    [params],
  );
  const searchQuery = params.get("q") ?? "";

  const sortOptions = Object.entries(sortingOptions);
  const requestedSort = params.get("sort") ?? "";
  const currentSort = sortOptions.some(([, value]) => value === requestedSort)
    ? requestedSort
    : undefined;
  const selectedThemeNames = useMemo(() => {
    return themes
      .filter((theme) => {
        const themeValue = categoryValues?.[theme.sys.id] ?? theme.sys.id;

        return selectedCategories.includes(themeValue);
      })
      .map((t) => t.name);
  }, [themes, selectedCategories, categoryValues]);

  const handleFilterItems = useCallback(
    (item: SearchIndexItem) => {
      if (selectedThemeNames.length === 0) return true;

      return item.themes.some((themeName) =>
        selectedThemeNames.includes(themeName),
      );
    },
    [selectedThemeNames],
  );

  const openSeeThemesModal = () => {
    setPendingCategories(selectedCategories);
    setSeeThemesModalOpen(true);
  };

  const closeSeeThemesModal = () => {
    setSeeThemesModalOpen(false);
  };

  const applySeeThemesModal = () => {
    updateUrl({
      category:
        pendingCategories.length > 0 ? pendingCategories.join(",") : null,
      page: "1",
    });
    setSeeThemesModalOpen(false);
  };

  const togglePendingCategory = (themeId: string) => {
    setPendingCategories((prev) =>
      prev.includes(themeId)
        ? prev.filter((id) => id !== themeId)
        : [...prev, themeId],
    );
  };

  const selectAllPending = () => {
    setPendingCategories((currentCategories) => {
      const allThemesSelected =
        themes.length > 0 &&
        themes.every((theme) => currentCategories.includes(theme.sys.id));

      return allThemesSelected ? [] : themes.map((theme) => theme.sys.id);
    });
  };

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      }
      const href = newParams.toString()
        ? `${pathname}?${newParams.toString()}`
        : pathname;

      if (clientSideNavigation) {
        replaceQuery(updates);
      } else {
        router.replace(href, { scroll: false });
      }
    },
    [clientSideNavigation, params, pathname, replaceQuery, router],
  );

  const toggleCategory = useCallback(
    (themeId: string) => {
      const next = selectedCategories.includes(themeId)
        ? selectedCategories.filter((id) => id !== themeId)
        : [...selectedCategories, themeId];
      updateUrl({
        category: next.length > 0 ? next.join(",") : null,
        page: "1",
      });
    },
    [selectedCategories, updateUrl],
  );

  const themeValues = themes.map(
    (theme) => categoryValues?.[theme.sys.id] ?? theme.sys.id,
  );
  const allThemesSelected =
    themeValues.length > 0 &&
    themeValues.every((themeValue) => selectedCategories.includes(themeValue));

  const toggleAllCategories = () => {
    updateUrl({
      category: allThemesSelected ? null : themeValues.join(","),
      page: "1",
    });
  };

  return (
    <section className={cn("flex flex-col w-full", className)}>
      {/* --- Desktop layout (hidden on mobile) --- */}
      <div className="hidden sm:block">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-20">
          <div
            className={cn(
              "flex items-center gap-3 w-full",
              mobileCatalogLayout ? "flex-col lg:flex-row" : "flex-row",
            )}
          >
            {mobileCatalogLayout ? (
              <CatalogTextFilter />
            ) : (
              <SearchBar
                variant="page"
                className="flex-1 max-w-none"
                initialQuery={searchQuery}
                placeholder="Digite sua pesquisa"
                hideViewAll={true}
                hideSuggestions={true}
                filterItems={handleFilterItems}
                onSubmit={(q) => updateUrl({ q: q || null, page: "1" })}
                onQueryChange={(q) => updateUrl({ q: q || null, page: "1" })}
              />
            )}

            {mobileCatalogLayout && (
              <Button
                aria-controls={mobileThemesId}
                aria-expanded={mobileThemesOpen}
                className="flex w-full lg:hidden"
                type="button"
                onClick={() => setMobileThemesOpen((open) => !open)}
              >
                <Icon id="filter" size={14} />
                Veja por temas
              </Button>
            )}

            <div
              className={cn(
                mobileCatalogLayout
                  ? "grid w-full grid-cols-2 gap-3 lg:contents"
                  : "contents",
              )}
            >
              <Button
                variant="secondary"
                className={cn(
                  "text-red-600 hover:bg-grey-100 grow lg:grow-0 lg:w-fit",
                  mobileCatalogLayout && "w-full",
                )}
                onClick={() => {
                  if (clientSideNavigation) {
                    replaceQuery(
                      Object.fromEntries(
                        Array.from(params.keys()).map((key) => [key, null]),
                      ),
                    );
                  } else {
                    router.replace(pathname, { scroll: false });
                  }
                }}
              >
                <span>Limpar filtros</span>
                <Icon id="no-filter" size={16} />
              </Button>

              <div
                className={cn(
                  "items-center gap-1 text-xs font-medium text-[#292829]",
                  mobileCatalogLayout ? "hidden md:flex" : "flex",
                )}
              >
                <Select
                  value={currentSort}
                  onValueChange={(value) => updateUrl({ sort: value })}
                >
                  <SelectTrigger className="w-fit !h-auto bg-transparent border-0 rounded-none !p-0 hover:bg-transparent cursor-pointer gap-1 text-xs font-medium text-[#292829] leading-5 shadow-none focus-visible:ring-0">
                    <SelectValue placeholder="Mais recentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sortOptions.map(([label, value]) => (
                        <SelectItem
                          value={value}
                          key={value}
                          className="cursor-pointer"
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div
            id={mobileThemesId}
            className={cn(
              "flex flex-wrap gap-x-6 gap-y-4 w-full mt-4",
              mobileCatalogLayout && !mobileThemesOpen && "max-lg:hidden",
            )}
          >
            {sortContentByDesiredOrder(themes, THEMES_NAVIGATION_ORDER).map(
              (theme) => {
                const iconKey = normalizeKey(theme.name);
                const themeValue =
                  categoryValues?.[theme.sys.id] ?? theme.sys.id;

                return (
                  <ThemeFilterCard
                    key={themeValue}
                    iconId={MACROTHEME_ICON_BY_ID[iconKey] || "list"}
                    color={theme.color || "#999999"}
                    name={theme.name}
                    href={`/macrothemes/${theme.id.replace(/_/g, "-")}`}
                    checked={selectedCategories.includes(themeValue)}
                    onCheckedChange={() => toggleCategory(themeValue)}
                  />
                );
              },
            )}
            <button
              className="flex items-center justify-center w-[145px] h-12 px-4 py-2 rounded-md text-[#018F39] font-medium text-sm cursor-pointer transition-colors hover:bg-[#DDEADF]"
              onClick={toggleAllCategories}
            >
              Selecionar todos
            </button>
          </div>
        </div>
      </div>

      {/* --- Mobile layout (hidden on desktop) --- */}
      <div className="flex flex-col gap-3 px-4 sm:hidden">
        <div className="flex flex-row items-start gap-3 p-4 bg-white border border-[#35B2DB] rounded-lg">
          <Icon id="info-alert" size={20} className="shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium leading-5 text-[#1995C1]">
              Atenção
            </span>
            <p className="text-sm font-normal leading-6 text-[#1995C1]">
              Para uma melhor experiência, recomendamos visualizar os painéis em
              um computador.
            </p>
          </div>
        </div>

        <SearchBar
          variant="page"
          className="w-full"
          initialQuery={searchQuery}
          hideViewAll={true}
          hideSuggestions={true}
          filterItems={handleFilterItems}
          onSubmit={(q) => updateUrl({ q: q || null, page: "1" })}
          onQueryChange={(q) => updateUrl({ q: q || null, page: "1" })}
        />

        <Button
          className="bg-[#018F39] hover:bg-[#018F39]/90 text-[#F8F7F8] h-10 rounded-md w-full"
          onClick={openSeeThemesModal}
        >
          <Icon id="filter" size={16} className="text-[#F8F7F8]" />
          <span>Veja por temas</span>
        </Button>

        <div className="flex flex-row items-center gap-3">
          <Button
            variant="secondary"
            className="flex-1 h-10 bg-white border border-[#EFEFEF] rounded-md text-[#E5333F] hover:bg-grey-100"
            onClick={() => {
              if (clientSideNavigation) {
                replaceQuery(
                  Object.fromEntries(
                    Array.from(params.keys()).map((key) => [key, null]),
                  ),
                );
              } else {
                router.replace(pathname, { scroll: false });
              }
            }}
          >
            <span>Limpar filtros</span>
            <Icon id="no-filter" size={16} />
          </Button>

          <Select
            value={currentSort}
            onValueChange={(value) => updateUrl({ sort: value })}
          >
            <SelectTrigger className="flex-1 h-10 border border-[#EFEFEF] !bg-grey-100 !px-4 text-xs font-medium text-[#292829] shadow-none hover:!bg-grey-200 focus-visible:ring-0 data-[state=open]:!bg-grey-200">
              <span className="text-xs font-medium text-[#292829]" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortOptions.map(([label, value]) => (
                  <SelectItem
                    value={value}
                    key={value}
                    className="cursor-pointer"
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {seeThemesModalOpen && (
        <SeeThemesModal
          themes={themes}
          selectedCategories={pendingCategories}
          onToggleCategory={togglePendingCategory}
          onSelectAll={selectAllPending}
          onClose={closeSeeThemesModal}
          onApply={applySeeThemesModal}
        />
      )}
    </section>
  );
}
