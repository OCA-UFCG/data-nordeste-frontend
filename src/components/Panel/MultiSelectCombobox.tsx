"use client";

import { ChevronDown } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { SelectOption } from "@/components/Panel/TerritorialFilterBar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { normalizeSearchText } from "@/features/search/search";

// Dentro de um Dialog (gaveta do celular), o popover precisa ser modal para a lista rolar.
export const InsideDialogContext = createContext(false);

const APPLY_DELAY_MS = 400;
const MAX_RENDERED = 100;

const summarize = (
  values: string[],
  options: SelectOption[],
  plural: string,
) => {
  if (values.length === 0) return "Todos";
  if (values.length > 1) return `${values.length} ${plural}`;

  return options.find((option) => option.value === values[0])?.label ?? "";
};

const filterOptions = (options: SelectOption[], search: string) => {
  const needle = normalizeSearchText(search);

  return needle
    ? options.filter((option) =>
        normalizeSearchText(option.label).includes(needle),
      )
    : options;
};

// PERF: ~1.800 municípios; marcadas primeiro, o resto aparece pela busca.
const limitOptions = (options: SelectOption[], checked: string[]) => {
  const marked = options.filter((option) => checked.includes(option.value));
  const others = options.filter((option) => !checked.includes(option.value));

  return [...marked, ...others].slice(0, Math.max(MAX_RENDERED, marked.length));
};

// Agrupa cliques seguidos numa navegação só; `flush` aplica na hora (ao fechar).
const useDebouncedApply = (onChange: (values: string[]) => void) => {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<string[] | null>(null);

  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current) onChange(pending.current);
    pending.current = null;
  };
  const schedule = (values: string[]) => {
    pending.current = values;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, APPLY_DELAY_MS);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  return { schedule, flush };
};

// A seleção local é a verdade enquanto a página recarrega; volta a seguir a URL quando ela muda.
const useSelection = (values: string[]) => {
  const [selected, setSelected] = useState(values);
  const valuesKey = values.join(",");

  useEffect(() => {
    setSelected(valuesKey ? valuesKey.split(",") : []);
  }, [valuesKey]);

  return [selected, setSelected] as const;
};

const OptionList = ({
  label,
  options,
  checked,
  onToggle,
}: {
  label: string;
  options: SelectOption[];
  checked: string[];
  onToggle: (value: string) => void;
}) => (
  <div role="group" aria-label={label} className="max-h-72 overflow-y-auto">
    {options.length === 0 && (
      <p className="px-2 py-3 text-base text-grey-900">Nenhum resultado</p>
    )}
    {limitOptions(options, checked).map((option) => (
      <label
        key={option.value}
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 text-base text-grey-1100 hover:bg-green-neutro"
      >
        <input
          type="checkbox"
          checked={checked.includes(option.value)}
          onChange={() => onToggle(option.value)}
          className="size-5 shrink-0 accent-green-800"
        />
        {option.label}
      </label>
    ))}
    {options.length > MAX_RENDERED && (
      <p className="px-2 py-3 text-sm text-grey-900">
        Mostrando {MAX_RENDERED} de {options.length}. Digite para encontrar os
        demais.
      </p>
    )}
  </div>
);

/**
 * Filtro com busca e várias escolhas (o Ctrl+clique do Power BI). Cada marcação
 * vale na hora; cliques seguidos viram uma navegação só.
 *
 * @example <MultiSelectCombobox id="mun" label="Município" plural="municípios" values={[]} options={opcoes} onChange={setMuns} />
 */
export const MultiSelectCombobox = ({
  id,
  label,
  plural,
  values,
  options,
  onChange,
}: {
  id: string;
  label: string;
  plural: string;
  values: string[];
  options: SelectOption[];
  onChange: (values: string[]) => void;
}) => {
  const insideDialog = useContext(InsideDialogContext);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useSelection(values);
  const { schedule, flush } = useDebouncedApply(onChange);
  const visible = useMemo(
    () => filterOptions(options, search),
    [options, search],
  );
  const labelId = `${id}-label`;

  const update = (next: string[]) => {
    setSelected(next);
    schedule(next);
  };
  const toggle = (value: string) =>
    update(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setSearch("");
    if (!next) flush();
  };

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={labelId} className="text-sm font-semibold text-grey-1100">
        {label}
      </span>
      <Popover modal={insideDialog} open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          id={id}
          aria-labelledby={`${labelId} ${id}`}
          className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-grey-300 bg-white px-3 text-left text-base text-grey-1100 focus:outline-2 focus:outline-green-800"
        >
          <span className="truncate">
            {summarize(selected, options, plural)}
          </span>
          <ChevronDown aria-hidden className="size-4 shrink-0" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-(--radix-popover-trigger-width) min-w-72 flex-col gap-2 bg-white p-2"
        >
          <input
            type="search"
            aria-label={`Buscar ${label.toLowerCase()}`}
            placeholder="Buscar"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-md border border-grey-300 px-3 text-base text-grey-1100 focus:outline-2 focus:outline-green-800"
          />
          <OptionList
            label={label}
            options={visible}
            checked={selected}
            onToggle={toggle}
          />
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => update([])}
              className="h-11 rounded-md border-t border-grey-200 px-4 text-base font-medium text-red-700 hover:bg-red-100 focus:outline-2 focus:outline-green-800"
            >
              Limpar seleção
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
