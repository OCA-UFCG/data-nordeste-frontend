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
import { useCallback, useMemo } from "react";
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
      className="flex flex-row items-center gap-2 px-2 h-8 w-[302px] bg-[#F8F7F8] border border-[#EFEFEF] rounded-lg cursor-pointer hover:bg-[#F0EFEF] transition-colors flex-shrink-0"
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
    <section className={cn("flex flex-col gap-4 w-full px-20", className)}>
      <div className="flex flex-row items-center gap-3 w-full max-w-[1440px]">
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

      <div className="flex flex-wrap gap-x-6 gap-y-3 w-full max-w-[1440px]">
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
    </section>
  );
}
