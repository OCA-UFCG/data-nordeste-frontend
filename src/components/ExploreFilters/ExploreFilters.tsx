"use client";

import { cn } from "@/lib/utils";
import { Icon } from "../Icon/Icon";
import { Checkbox } from "../ui/checkbox";
import { SearchBar } from "../SearchBar/SearchBar";
import { Button } from "../ui/button";
import { MACROTHEME_ICON_BY_ID } from "@/features/macrothemes/constants";
import { sortingTypes } from "@/utils/constants";
import { normalizeKey } from "@/utils/functions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
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
      className="flex flex-row items-center gap-2 px-2 h-8 sm:w-[302px] bg-[#F8F7F8] border border-[#EFEFEF] rounded-lg cursor-pointer hover:bg-[#F0EFEF] transition-colors flex-shrink-0"
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
  themes: Pick<MacroTheme, "name" | "color" | "sys">[];
}

export function ExploreFilters({ className, themes }: ExploreFiltersProps) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const selectedCategories = useMemo(
    () => params.get("category")?.split(",").filter(Boolean) ?? [],
    [params],
  );

  const currentSort = params.get("sort") || sortingTypes["Mais recente"];

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
      router.replace(pathname + "?" + newParams.toString());
    },
    [params, pathname, router],
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
        <div className="w-full max-w-[1440px] mx-auto px-20">
          <div className="flex flex-row items-center gap-3 w-full">
            <SearchBar variant="page" className="flex-1 max-w-none" />

            <Button
              variant="secondary"
              className="text-red-600 hover:bg-grey-100 grow lg:grow-0 lg:w-fit"
              onClick={() => router.replace(pathname)}
            >
              <span>Limpar filtros</span>
              <Icon id="no-filter" size={16} />
            </Button>

            <Select
              value={currentSort}
              onValueChange={(value) => updateUrl({ sort: value })}
            >
              <SelectTrigger className="w-fit !h-auto bg-transparent border-0 rounded-none !p-0 hover:bg-transparent cursor-pointer gap-1 text-xs font-medium text-[#292829] leading-5 shadow-none focus-visible:ring-0">
                <SelectValue placeholder="Mais recentes" />
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

          <div className="flex flex-wrap gap-x-6 gap-y-3 w-full mt-4">
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
            <p className=" font-normal leading-6 text-[#1995C1]">
              Para uma melhor visualização dos painéis recomendamos sua
              visualização num computador
            </p>
          </div>
        </div>

        <SearchBar variant="page" className="w-full" />

        <Button
          className="bg-[#018F39] hover:bg-[#018F39]/90 text-[#F8F7F8] h-10 rounded-md w-full"
          onClick={() => setMobileFiltersOpen((prev) => !prev)}
        >
          <Icon id="filter" size={16} className="text-[#F8F7F8]" />
          <span>Veja por temas</span>
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
              <span className="text-xs font-medium text-[#292829]"></span>
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
