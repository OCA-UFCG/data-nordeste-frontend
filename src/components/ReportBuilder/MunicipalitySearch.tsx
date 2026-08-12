"use client";

import type { KeyboardEvent, ReactElement } from "react";
import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/Icon/Icon";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { filterMunicipalitySuggestions } from "@/features/reports/municipalitySearch";
import { cn } from "@/lib/utils";

type MunicipalitySearchProps = {
  cities: string[];
  onChange: (value: string) => void;
  value: string;
};

export function MunicipalitySearch({
  cities,
  onChange,
  value,
}: MunicipalitySearchProps): ReactElement {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => filterMunicipalitySuggestions(value, cities),
    [value, cities],
  );
  const activeIndex = Math.min(highlightedIndex, suggestions.length - 1);
  const showSuggestions = open && suggestions.length > 0;

  const selectSuggestion = (city: string): void => {
    onChange(city);
    setOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  const handleChange = (nextValue: string): void => {
    onChange(nextValue);
    setHighlightedIndex(0);
    setOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(
        (index) => (index - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      const city = suggestions[activeIndex];
      if (city) {
        event.preventDefault();
        selectSuggestion(city);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover onOpenChange={setOpen} open={showSuggestions}>
      <PopoverAnchor asChild>
        <label className="mt-4 flex h-10 w-full items-center gap-2 rounded-lg bg-[#EFEFEF] px-3">
          <span className="sr-only">Pesquise o município</span>
          <input
            ref={inputRef}
            aria-autocomplete="list"
            aria-activedescendant={
              showSuggestions
                ? `report-municipality-option-${activeIndex}`
                : undefined
            }
            aria-controls="report-municipality-suggestions"
            aria-expanded={showSuggestions}
            className="min-w-0 flex-1 bg-transparent text-sm text-[#292929] outline-none placeholder:text-[#737373]"
            onChange={(event) => handleChange(event.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquise o município"
            role="combobox"
            type="search"
            value={value}
          />
          <Icon id="search-icon" size={12} />
        </label>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="border border-grey-400 bg-white p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
        sideOffset={4}
      >
        <ul
          id="report-municipality-suggestions"
          role="listbox"
          className="max-h-64 overflow-auto py-1"
        >
          {suggestions.map((city, index) => (
            <li key={city} className="list-none">
              <button
                aria-selected={index === activeIndex}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm text-[#292929]",
                  index === activeIndex && "bg-[#DDEADF]",
                )}
                id={`report-municipality-option-${index}`}
                onClick={() => selectSuggestion(city)}
                onMouseEnter={() => setHighlightedIndex(index)}
                role="option"
                type="button"
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
