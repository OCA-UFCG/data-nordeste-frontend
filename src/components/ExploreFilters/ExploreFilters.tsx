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
      className="flex h-8 w-full cursor-pointer flex-row items-center gap-2 rounded-lg border border-[#EFEFEF] bg-[#F8F7F8] px-2 transition-colors hover:bg-[#F0EFEF] sm:w-[302px] sm:flex-shrink-0"
      onClick={() => onCheckedChange?.(!checked)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="w-4 h-4 border-[#018F39] data-[state=checked]:bg-[#018F39] flex-shrink-0 rounded"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="w-px h-full bg-[#EFEFEF] flex-shrink-0" />

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

  const selectedCategories = useMemo(
    () => params.get("category")?.split(",").filter(Boolean) ?? [],
    [params],
  );

  const currentSort = params.get("sort") || "";

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
    <section className={cn("flex flex-col gap-4 w-full", className)}>
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
            "flex flex-wrap gap-x-6 gap-y-3 w-full mt-4",
            mobileCatalogLayout && !mobileThemesOpen && "max-lg:hidden",
          )}
        >
          {themes.map((theme) => {
            const iconKey = normalizeKey(theme.name);
            const themeValue =
              categoryValues?.[theme.sys.id] ??
              (categoryValue === "theme-id" ? theme.id : theme.sys.id);

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
    </section>
  );
}
