"use client";

import { cn } from "@/lib/utils";
import { Icon } from "../Icon/Icon";
import { Checkbox } from "../ui/checkbox";
import { SearchBar } from "../SearchBar/SearchBar";
import { CatalogTextFilter } from "../CatalogTextFilter/CatalogTextFilter";
import { Button } from "../ui/button";
import { MACROTHEME_ICON_BY_ID } from "@/features/macrothemes/constants";
import { sortingTypes } from "@/utils/constants";
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
import type { MacroTheme } from "@/utils/interfaces";
import type { SearchIndexItem } from "@/features/search/types";

interface ThemeFilterCardProps {
  iconId: string;
  color: string;
  name: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

function ThemeFilterCard({
  iconId,
  color,
  name,
  checked,
  onCheckedChange,
}: ThemeFilterCardProps) {
  return (
    <div
      className="flex flex-row h-8 sm:w-[302px] bg-[#F8F7F8] border border-[#EFEFEF] rounded-lg cursor-pointer hover:bg-[#F0EFEF] transition-colors flex-shrink-0 overflow-hidden"
      onClick={() => onCheckedChange?.(!checked)}
    >
      <div className="flex items-center justify-center h-full w-8 rounded-l-lg hover:bg-[#DDEADF] transition-colors">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="w-4 h-4 border-[#018F39] data-[state=checked]:bg-[#018F39] flex-shrink-0 rounded"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="w-px h-full bg-[#EFEFEF]" />

      <div className="flex items-center gap-2 flex-1 h-full px-2 rounded-r-lg hover:bg-[#DDEADF] transition-colors">
        <Icon id={iconId} size={16} style={{ color }} />

        <span className="flex-1 text-sm font-normal text-[#292829] truncate">
          {name}
        </span>

        <Icon
          className="text-[#999999] flex-shrink-0 rotate-270"
          id="expand"
          size={12}
        />
      </div>
    </div>
  );
}

interface ExploreFiltersProps {
  className?: string;
  themes: Pick<MacroTheme, "id" | "name" | "color" | "sys">[];
  categoryValue?: "contentful-id" | "theme-id";
  categoryValues?: Record<string, string>;
  clientSideNavigation?: boolean;
  mobileCatalogLayout?: boolean;
  showClearFilters?: boolean;
  showSorting?: boolean;
  sortingAsField?: boolean;
  sortingLabel?: string;
  sortingOptions?: Record<string, string>;
}

export function ExploreFilters({
  className,
  themes,
  categoryValue = "contentful-id",
  categoryValues,
  clientSideNavigation = false,
  mobileCatalogLayout = false,
  showClearFilters = true,
  showSorting = true,
  sortingAsField = false,
  sortingLabel,
  sortingOptions = sortingTypes,
}: ExploreFiltersProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const mobileThemesId = useId();
  const [mobileThemesOpen, setMobileThemesOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const selectedCategories = useMemo(
    () => params.get("category")?.split(",").filter(Boolean) ?? [],
    [params],
  );

  const currentSort = params.get("sort") || sortingTypes["Mais recente"];
  const selectedThemeNames = useMemo(() => {
    return themes
      .filter((theme) => {
        const themeValue =
          categoryValues?.[theme.sys.id] ??
          (categoryValue === "theme-id" ? theme.id : theme.sys.id);

        return selectedCategories.includes(themeValue);
      })
      .map((t) => t.name);
  }, [themes, selectedCategories, categoryValues, categoryValue]);

  const handleFilterItems = useCallback(
    (item: SearchIndexItem) => {
      const isPanel = ["data-panel", "data-panel-detail"].includes(item.type);

      if (!isPanel) return false;

      if (selectedThemeNames.length === 0) return true;

      return item.themes.some((themeName) =>
        selectedThemeNames.includes(themeName),
      );
    },
    [selectedThemeNames],
  );

  const handleSearchSubmit = useCallback(
    (query: string) => {
      const themeParams =
        selectedThemeNames.length > 0
          ? `&themes=${encodeURIComponent(selectedThemeNames.join(","))}`
          : "";
      router.push(
        `/search?q=${encodeURIComponent(query)}&type=panels${themeParams}`,
      );
    },
    [router, selectedThemeNames],
  );

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
        window.history.replaceState(null, "", href);
      } else {
        router.replace(href);
      }
    },
    [clientSideNavigation, params, pathname, router],
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
                placeholder="Buscar conteúdo"
                hideViewAll={true}
                filterItems={handleFilterItems}
                onSubmit={handleSearchSubmit}
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
              {showClearFilters && (
                <Button
                  variant="secondary"
                  className={cn(
                    "text-red-600 hover:bg-grey-100 grow lg:grow-0 lg:w-fit",
                    mobileCatalogLayout && "w-full",
                  )}
                  onClick={() => {
                    if (clientSideNavigation) {
                      window.history.replaceState(null, "", pathname);
                    } else {
                      router.replace(pathname);
                    }
                  }}
                >
                  <span>Limpar filtros</span>
                  <Icon id="no-filter" size={16} />
                </Button>
              )}

              {showSorting && (
                <>
                  {sortingAsField && (
                    <div className="flex min-h-10 w-full items-center rounded-md border border-grey-200 px-3 text-grey-600 shadow-sm lg:w-auto">
                      <Select
                        value={currentSort}
                        onValueChange={(value) => updateUrl({ sort: value })}
                      >
                        <SelectTrigger className="w-full !h-auto min-w-[126px] justify-between border-0 bg-transparent !p-0 text-sm font-normal text-grey-600 shadow-none focus-visible:ring-0">
                          <SelectValue placeholder="Ordenar por" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {Object.entries(sortingOptions).map(
                              ([label, value]) => (
                                <SelectItem
                                  value={value}
                                  key={value}
                                  className="cursor-pointer"
                                >
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div
                    className={cn(
                      "items-center gap-1 text-xs font-medium text-[#292829]",
                      sortingAsField
                        ? "hidden"
                        : mobileCatalogLayout
                          ? "hidden md:flex"
                          : "flex",
                    )}
                  >
                    {sortingLabel && <span>{sortingLabel}</span>}
                    <Select
                      value={currentSort}
                      onValueChange={(value) => updateUrl({ sort: value })}
                    >
                      <SelectTrigger className="w-fit !h-auto bg-transparent border-0 rounded-none !p-0 hover:bg-transparent cursor-pointer gap-1 text-xs font-medium text-[#292829] leading-5 shadow-none focus-visible:ring-0">
                        <SelectValue placeholder="Mais recente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(sortingOptions).map(
                            ([label, value]) => (
                              <SelectItem
                                value={value}
                                key={value}
                                className="cursor-pointer"
                              >
                                {label}
                              </SelectItem>
                            ),
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div
            id={mobileThemesId}
            className={cn(
              "flex flex-wrap gap-x-4 gap-y-2 w-full mt-4",
              mobileCatalogLayout && !mobileThemesOpen && "max-lg:hidden",
            )}
          >
            {themes.map((theme) => {
              const iconKey = normalizeKey(theme.name);
              const themeValue =
                categoryValues?.[theme.sys.id] ??
                (categoryValue === "theme-id"
                  ? (theme as MacroTheme & { id: string }).id
                  : theme.sys.id);

              return (
                <ThemeFilterCard
                  key={themeValue}
                  iconId={MACROTHEME_ICON_BY_ID[iconKey] || "list"}
                  color={theme.color || "#999999"}
                  name={theme.name}
                  checked={selectedCategories.includes(themeValue)}
                  onCheckedChange={() => toggleCategory(themeValue)}
                />
              );
            })}
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
              Para uma melhor visualização dos painéis recomendamos sua
              visualização num computador.
            </p>
          </div>
        </div>

        <SearchBar
          variant="page"
          className="w-full"
          hideViewAll={true}
          filterItems={handleFilterItems}
          onSubmit={handleSearchSubmit}
        />

        <Button
          className="bg-[#018F39] hover:bg-[#018F39]/90 text-[#F8F7F8] h-10 rounded-md w-full"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
        >
          <Icon id="filter" size={16} className="text-[#F8F7F8]" />
          <span>Filtrar</span>
        </Button>

        <div className="flex flex-row items-center gap-3">
          <Button
            variant="secondary"
            className="flex-1 h-10 bg-white border border-[#EFEFEF] rounded-md text-[#E5333F] hover:bg-grey-100"
            onClick={() => router.replace(pathname)}
          >
            <span>Limpar filtros</span>
            <Icon id="no-filter" size={16} />
          </Button>

          <Select
            value={currentSort}
            onValueChange={(value) => updateUrl({ sort: value })}
          >
            <SelectTrigger className="flex-1 h-10 bg-white border border-[#EFEFEF] rounded-md !px-4 text-xs font-medium text-[#292829] shadow-none focus-visible:ring-0">
              <span className="text-xs font-medium text-[#292829]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {Object.entries(sortingTypes).map(([label, value]) => (
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

        {mobileFiltersOpen && (
          <div className="flex flex-col gap-2">
            {themes.map((theme) => {
              const iconKey = normalizeKey(theme.name);

              return (
                <ThemeFilterCard
                  key={theme.sys.id}
                  iconId={MACROTHEME_ICON_BY_ID[iconKey] || "list"}
                  color={theme.color || "#999999"}
                  name={theme.name}
                  checked={selectedCategories.includes(theme.sys.id)}
                  onCheckedChange={() => toggleCategory(theme.sys.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
