"use client";

import { ChevronDown, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  indexOptions,
  sameValues,
  searchOptions,
  toggleValue,
  type FilterOption,
} from "@/features/panels/filterOptions";

export type MultiSelectNoun = { singular: string; plural: string };

type MultiSelectProps = {
  label: string;
  noun: MultiSelectNoun;
  options: FilterOption[];
  values: string[];
  onChange: (next: string[]) => void;
};

const summarize = ({ options, values, noun }: MultiSelectProps): string => {
  if (!values.length) return "Todos";
  if (values.length > 1) return `${values.length} ${noun.plural}`;

  return options.find((option) => option.value === values[0])?.label ?? "1";
};

const SearchBox = ({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) => (
  <div className="flex items-center gap-2 border-b border-grey-200 px-3">
    <Search aria-hidden className="size-4 shrink-0 text-grey-700" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={label}
      aria-label={label}
      className="h-11 w-full min-w-0 bg-transparent text-base text-grey-1100 outline-none"
    />
  </div>
);

const OptionList = ({
  options,
  draft,
  onToggle,
  label,
}: {
  options: FilterOption[];
  draft: string[];
  onToggle: (value: string) => void;
  label: string;
}) => (
  <ul aria-label={label} className="max-h-72 overflow-y-auto py-1">
    {options.map((option) => (
      <li key={option.value}>
        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-base text-grey-1100 hover:bg-green-100">
          <input
            type="checkbox"
            checked={draft.includes(option.value)}
            onChange={() => onToggle(option.value)}
            className="size-4 shrink-0 accent-green-800"
          />
          {option.label}
        </label>
      </li>
    ))}
    {options.length ? null : (
      <li className="px-3 py-4 text-center text-sm text-grey-800">
        Nenhum resultado.
      </li>
    )}
  </ul>
);

const ListFooter = ({
  count,
  onClear,
  onApply,
}: {
  count: number;
  onClear: () => void;
  onApply: () => void;
}) => (
  <div className="flex items-center justify-between gap-2 border-t border-grey-200 p-2">
    <button
      type="button"
      onClick={onClear}
      className="h-9 rounded-md px-3 text-sm font-medium text-red-700 hover:bg-red-100"
    >
      Limpar seleção
    </button>
    <button
      type="button"
      onClick={onApply}
      className="h-9 rounded-md bg-green-800 px-4 text-sm font-medium text-white hover:bg-green-900"
    >
      Aplicar{count ? ` (${count})` : ""}
    </button>
  </div>
);

// O rascunho só vira filtro ao fechar: marcar vários faz uma consulta só.
const useMultiSelect = ({ values, onChange }: MultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(values);
  const changeOpen = (next: boolean) => {
    if (next) setDraft(values);
    if (!next && !sameValues(draft, values)) onChange(draft);
    setQuery("");
    setOpen(next);
  };
  const toggle = (value: string) =>
    setDraft((current) => toggleValue(current, value));

  return { open, changeOpen, query, setQuery, draft, setDraft, toggle };
};

// Fixa pelos já aplicados (`pinned`): a lista não pula enquanto se marca.
const useListedOptions = (
  options: FilterOption[],
  query: string,
  pinned: string[],
) => {
  const indexed = useMemo(() => indexOptions(options), [options]);

  return searchOptions(indexed, query, pinned);
};

const SelectTrigger = ({ id, summary }: { id: string; summary: string }) => (
  <PopoverTrigger
    aria-labelledby={`${id}-label ${id}-value`}
    className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-grey-300 bg-white px-3 text-left text-base text-grey-1100 focus:outline-2 focus:outline-green-800"
  >
    <span id={`${id}-value`} className="truncate">
      {summary}
    </span>
    <ChevronDown aria-hidden className="size-4 shrink-0" />
  </PopoverTrigger>
);

/**
 * Multi-choice filter with search, laid out like `FilterSelect`.
 * @example <MultiSelectFilter label="Município" noun={{ singular: "município", plural: "municípios" }} options={options} values={filters.muns} onChange={setMuns} />
 */
export const MultiSelectFilter = (props: MultiSelectProps) => {
  const id = useId();
  const select = useMultiSelect(props);
  const listed = useListedOptions(props.options, select.query, props.values);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={`${id}-label`} className="text-sm font-semibold text-grey-1100">
        {props.label}
      </span>
      <Popover open={select.open} onOpenChange={select.changeOpen}>
        <SelectTrigger id={id} summary={summarize(props)} />
        <PopoverContent
          align="start"
          className="w-(--radix-popover-trigger-width) min-w-72 bg-white p-0"
        >
          <SearchBox
            value={select.query}
            onChange={select.setQuery}
            label={`Buscar ${props.noun.singular}`}
          />
          <OptionList
            options={listed}
            draft={select.draft}
            onToggle={select.toggle}
            label={props.label}
          />
          <ListFooter
            count={select.draft.length}
            onClear={() => select.setDraft([])}
            onApply={() => select.changeOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
