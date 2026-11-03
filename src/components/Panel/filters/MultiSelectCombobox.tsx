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
import type { SelectOption } from "@/components/Panel/filters/TerritorialFilterBar";
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

const OptionCheckbox = ({
  option,
  checked,
  disabled,
  onToggle,
}: {
  option: SelectOption;
  checked: boolean;
  disabled: boolean;
  onToggle: (value: string) => void;
}) => (
  <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 text-base text-grey-1100 hover:bg-green-neutro has-disabled:cursor-not-allowed has-disabled:text-grey-800 has-disabled:hover:bg-transparent">
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={() => onToggle(option.value)}
      className="size-5 shrink-0 accent-green-800"
    />
    {option.label}
  </label>
);

const RenderedCountNotice = ({ total }: { total: number }) =>
  total > MAX_RENDERED ? (
    <p className="px-2 py-3 text-sm text-grey-900">
      Mostrando {MAX_RENDERED} de {total}. Digite para encontrar os demais.
    </p>
  ) : null;

type OptionListProps = {
  label: string;
  options: SelectOption[];
  checked: string[];
  full: boolean;
  onToggle: (value: string) => void;
};

// `full`: chegou ao máximo; só dá para desmarcar até abrir espaço.
const OptionList = ({
  label,
  options,
  checked,
  full,
  onToggle,
}: OptionListProps) => (
  <div role="group" aria-label={label} className="max-h-72 overflow-y-auto">
    {options.length === 0 && (
      <p className="px-2 py-3 text-base text-grey-900">Nenhum resultado</p>
    )}
    {limitOptions(options, checked).map((option) => (
      <OptionCheckbox
        key={option.value}
        option={option}
        checked={checked.includes(option.value)}
        disabled={full && !checked.includes(option.value)}
        onToggle={onToggle}
      />
    ))}
    <RenderedCountNotice total={options.length} />
  </div>
);

// Região viva sempre na página, só o texto muda: leitores de tela costumam
// ignorar um role="status" que já nasce preenchido.
const LimitNotice = ({
  full,
  max,
  plural,
}: {
  full: boolean;
  max?: number;
  plural: string;
}) => (
  <p role="status" className="px-2 text-sm text-grey-900 empty:hidden">
    {full ? `Máximo de ${max} ${plural} selecionados` : ""}
  </p>
);

// Marca e desmarca na hora; a navegação sai agrupada (useDebouncedApply).
const useComboboxSelection = (
  values: string[],
  onChange: (values: string[]) => void,
  max?: number,
) => {
  const [selected, setSelected] = useSelection(values);
  const { schedule, flush } = useDebouncedApply(onChange);
  const full = max !== undefined && selected.length >= max;

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

  return { selected, full, update, toggle, flush };
};

const ComboboxTrigger = ({
  id,
  labelId,
  summary,
}: {
  id: string;
  labelId: string;
  summary: string;
}) => (
  <PopoverTrigger
    id={id}
    aria-labelledby={`${labelId} ${id}`}
    className="flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-grey-300 bg-white px-3 text-left text-base text-grey-1100 focus:outline-2 focus:outline-green-800"
  >
    <span className="truncate">{summary}</span>
    <ChevronDown aria-hidden className="size-4 shrink-0" />
  </PopoverTrigger>
);

const OptionSearch = ({
  label,
  search,
  onSearch,
}: {
  label: string;
  search: string;
  onSearch: (search: string) => void;
}) => (
  <input
    type="search"
    aria-label={`Buscar ${label.toLowerCase()}`}
    placeholder="Buscar"
    value={search}
    onChange={(event) => onSearch(event.target.value)}
    className="h-11 w-full rounded-md border border-grey-300 px-3 text-base text-grey-1100 focus:outline-2 focus:outline-green-800"
  />
);

const ClearSelectionButton = ({ onClear }: { onClear: () => void }) => (
  <button
    type="button"
    onClick={onClear}
    className="h-11 rounded-md border-t border-grey-200 px-4 text-base font-medium text-red-700 hover:bg-red-100 focus:outline-2 focus:outline-green-800"
  >
    Limpar seleção
  </button>
);

type MultiSelectComboboxProps = {
  id: string;
  label: string;
  plural: string;
  values: string[];
  options: SelectOption[];
  onChange: (values: string[]) => void;
  max?: number;
};

// Abrir ou fechar zera a busca; fechar aplica na hora o que estava pendente.
const usePopoverState = (flush: () => void) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    setSearch("");
    if (!next) flush();
  };

  return { open, search, setSearch, handleOpenChange };
};

type ComboboxPanelProps = Pick<
  MultiSelectComboboxProps,
  "label" | "plural" | "options" | "max"
> & {
  selection: ReturnType<typeof useComboboxSelection>;
  search: string;
  onSearch: (search: string) => void;
};

const ComboboxPanel = (props: ComboboxPanelProps) => {
  const { label, options, search, selection } = props;
  const visible = useMemo(
    () => filterOptions(options, search),
    [options, search],
  );

  return (
    <PopoverContent
      align="start"
      className="flex w-(--radix-popover-trigger-width) min-w-72 flex-col gap-2 bg-white p-2"
    >
      <OptionSearch label={label} search={search} onSearch={props.onSearch} />
      <OptionList
        label={label}
        options={visible}
        checked={selection.selected}
        full={selection.full}
        onToggle={selection.toggle}
      />
      <LimitNotice
        full={selection.full}
        max={props.max}
        plural={props.plural}
      />
      {selection.selected.length > 0 && (
        <ClearSelectionButton onClear={() => selection.update([])} />
      )}
    </PopoverContent>
  );
};

/**
 * Filtro com busca e várias escolhas (o Ctrl+clique do Power BI). Cada marcação
 * vale na hora; cliques seguidos viram uma navegação só.
 *
 * `max`: acima dele o servidor corta a seleção sem avisar; aqui as opções não
 * marcadas travam e aparece o aviso. Sem `max`, não há limite.
 *
 * @example <MultiSelectCombobox id="mun" label="Município" plural="municípios" values={[]} options={opcoes} onChange={setMuns} max={100} />
 */
export const MultiSelectCombobox = (props: MultiSelectComboboxProps) => {
  const insideDialog = useContext(InsideDialogContext);
  const selection = useComboboxSelection(
    props.values,
    props.onChange,
    props.max,
  );
  const popover = usePopoverState(selection.flush);
  const labelId = `${props.id}-label`;
  const summary = summarize(selection.selected, props.options, props.plural);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={labelId} className="text-sm font-semibold text-grey-1100">
        {props.label}
      </span>
      <Popover
        modal={insideDialog}
        open={popover.open}
        onOpenChange={popover.handleOpenChange}
      >
        <ComboboxTrigger id={props.id} labelId={labelId} summary={summary} />
        <ComboboxPanel
          label={props.label}
          plural={props.plural}
          options={props.options}
          max={props.max}
          selection={selection}
          search={popover.search}
          onSearch={popover.setSearch}
        />
      </Popover>
    </div>
  );
};
