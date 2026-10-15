"use client";

import { ChevronDownIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_OPTION,
  ANALYSES_SORT_OPTIONS,
  type AnalysesFilterState,
  type AnalysesSort,
} from "./analysesFilters";

type AnalysesFilterBarProps = {
  panels: { id: string; title: string }[];
  years: string[];
  value: AnalysesFilterState;
  onChange: (value: AnalysesFilterState) => void;
};

// The trigger ships with an up/down icon; the field selects use a single
// chevron, as in the Figma, so the default icon is hidden for them.
const FIELD_TRIGGER =
  "!h-10 w-full bg-white border-[#E4E2E3] rounded-md px-3 text-sm text-[#292829] shadow-none cursor-pointer focus-visible:ring-0 [&>svg:last-child]:hidden";

/** Painel, Data and ordering filters of the Análises tab. Example: `<AnalysesFilterBar panels={panels} years={["2026"]} value={state} onChange={setState} />`. */
export function AnalysesFilterBar({
  panels,
  years,
  value,
  onChange,
}: AnalysesFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="w-full sm:w-[430px]">
        <Select
          value={value.panelId}
          onValueChange={(panelId) => onChange({ ...value, panelId })}
        >
          <SelectTrigger aria-label="Painel" className={FIELD_TRIGGER}>
            <SelectValue placeholder="Painel" />
            <ChevronDownIcon className="size-4 opacity-60" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL_OPTION} className="cursor-pointer">
                Painel
              </SelectItem>
              {panels.map((panel) => (
                <SelectItem
                  key={panel.id}
                  value={panel.id}
                  className="cursor-pointer"
                >
                  {panel.title.replace(/^Acessar Painel:\s*/i, "")}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="w-full sm:w-[200px]">
        <Select
          value={value.year}
          onValueChange={(year) => onChange({ ...value, year })}
        >
          <SelectTrigger aria-label="Data" className={FIELD_TRIGGER}>
            <SelectValue placeholder="Data" />
            <ChevronDownIcon className="size-4 opacity-60" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL_OPTION} className="cursor-pointer">
                Data
              </SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year} className="cursor-pointer">
                  {year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Select
        value={value.sort}
        onValueChange={(sort) =>
          onChange({ ...value, sort: sort as AnalysesSort })
        }
      >
        <SelectTrigger
          aria-label="Ordenar"
          className="w-fit !h-auto bg-transparent border-0 rounded-none !p-0 cursor-pointer gap-1 text-xs font-medium text-[#292829] shadow-none focus-visible:ring-0 sm:ml-4"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ANALYSES_SORT_OPTIONS.map(({ value: sort, label }) => (
              <SelectItem key={sort} value={sort} className="cursor-pointer">
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
