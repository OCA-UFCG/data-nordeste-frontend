"use client";

import { ChevronDown } from "lucide-react";
import {
  createContext,
  type Ref,
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
import { cn } from "@/lib/utils";

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
// Se tudo cabe, a ordem original fica (anos em sequência, estados em ordem
// alfabética): subir a marcada só serve para ela não ficar fora do corte.
const limitOptions = (options: SelectOption[], checked: string[]) => {
  if (options.length <= MAX_RENDERED) return options;
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

// Escolha única: sem checkbox. A opção marcada ganha fundo e negrito; clicar
// nela de novo limpa (`aria-pressed` anuncia o estado).
const OptionButton = ({
  option,
  checked,
  onToggle,
}: {
  option: SelectOption;
  checked: boolean;
  onToggle: (value: string) => void;
}) => (
  <button
    type="button"
    aria-pressed={checked}
    onClick={() => onToggle(option.value)}
    className={cn(
      "flex min-h-11 w-full cursor-pointer items-center rounded px-2 text-left text-base text-grey-1100 hover:bg-green-neutro focus-visible:outline-2 focus-visible:outline-green-800",
      checked && "bg-green-neutro font-semibold",
    )}
  >
    {option.label}
  </button>
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
  single?: boolean;
  onToggle: (value: string) => void;
};

// `full`: chegou ao máximo; só dá para desmarcar até abrir espaço.
const OptionList = ({
  label,
  options,
  checked,
  full,
  single,
  onToggle,
}: OptionListProps) => (
  <div
    role="group"
    aria-label={label}
    className="max-h-72 min-h-0 overflow-y-auto"
  >
    {options.length === 0 && (
      <p className="px-2 py-3 text-base text-grey-900">Nenhum resultado</p>
    )}
    {limitOptions(options, checked).map((option) =>
      single ? (
        <OptionButton
          key={option.value}
          option={option}
          checked={checked.includes(option.value)}
          onToggle={onToggle}
        />
      ) : (
        <OptionCheckbox
          key={option.value}
          option={option}
          checked={checked.includes(option.value)}
          disabled={full && !checked.includes(option.value)}
          onToggle={onToggle}
        />
      ),
    )}
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

type SelectionRules = Pick<
  MultiSelectComboboxProps,
  "max" | "single" | "required"
>;

// Marca e desmarca na hora; a navegação sai agrupada (useDebouncedApply).
// `single`: marcar outra opção troca a escolhida, e marcar a escolhida limpa
// (exceto com `required`, em que ela continua marcada).
const useComboboxSelection = (
  values: string[],
  onChange: (values: string[]) => void,
  { max, single, required }: SelectionRules,
) => {
  const [selected, setSelected] = useSelection(values);
  const { schedule, flush } = useDebouncedApply(onChange);
  const full = !single && max !== undefined && selected.length >= max;

  const update = (next: string[]) => {
    setSelected(next);
    schedule(next);
  };
  const toggle = (value: string) => {
    if (single && required && selected.includes(value)) return;
    if (single) return update(selected.includes(value) ? [] : [value]);

    update(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  return { selected, full, update, toggle, flush };
};

// Padrão do filtro do PIB; o painel do protótipo troca a classe inteira por `triggerClassName`.
const TRIGGER_CLASS =
  "flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-grey-300 bg-white px-3 text-left text-base text-grey-1100 focus:outline-2 focus:outline-green-800";

// `asChild` com um <button> nosso: no React 18 o `PopoverTrigger` do shadcn
// (função sem forwardRef) não repassa a `ref`, e o PIB precisa dela.
const ComboboxTrigger = ({
  id,
  labelId,
  summary,
  className,
  triggerRef,
}: {
  id: string;
  labelId: string;
  summary: string;
  className?: string;
  triggerRef?: Ref<HTMLButtonElement>;
}) => (
  <PopoverTrigger asChild>
    <button
      ref={triggerRef}
      type="button"
      id={id}
      aria-labelledby={`${labelId} ${id}`}
      className={className ?? TRIGGER_CLASS}
    >
      <span className="truncate">{summary}</span>
      <ChevronDown aria-hidden className="size-4 shrink-0" />
    </button>
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

// Classes opcionais para o filtro caber no layout de outro painel (o do
// protótipo). Sem elas, vale o visual do PIB.
export type ComboboxLook = {
  fieldClassName?: string;
  labelClassName?: string;
  triggerClassName?: string;
};

type MultiSelectComboboxProps = ComboboxLook & {
  id: string;
  label: string;
  plural: string;
  values: string[];
  options: SelectOption[];
  onChange: (values: string[]) => void;
  max?: number;

  // Uma escolha só, com o mesmo visual (o painel do protótipo).
  single?: boolean;

  // Nunca fica vazio (ex.: Área de interesse): some o "Limpar seleção".
  required?: boolean;

  // O botão que abre a lista (o PIB foca e faz piscar o Ano por ele).
  triggerRef?: Ref<HTMLButtonElement>;
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
  "label" | "plural" | "options" | "max" | "single" | "required"
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

  // INTENTIONAL: sempre abre para baixo, colado no filtro. Com a barra perto
  // do pé da tela o Radix virava a lista para cima, cobrindo o título do
  // painel; agora ela encolhe até a altura que sobra (e rola por dentro),
  // com um piso de 11rem para a busca e algumas opções continuarem usáveis.
  return (
    <PopoverContent
      align="start"
      side="bottom"
      avoidCollisions={false}
      className="flex max-h-[max(11rem,var(--radix-popover-content-available-height))] w-(--radix-popover-trigger-width) min-w-72 flex-col gap-2 bg-white p-2"
    >
      <OptionSearch label={label} search={search} onSearch={props.onSearch} />
      <OptionList
        label={label}
        options={visible}
        checked={selection.selected}
        full={selection.full}
        single={props.single}
        onToggle={selection.toggle}
      />
      <LimitNotice
        full={selection.full}
        max={props.max}
        plural={props.plural}
      />
      {!props.required && selection.selected.length > 0 && (
        <ClearSelectionButton onClear={() => selection.update([])} />
      )}
    </PopoverContent>
  );
};

/**
 * Filtro com busca e várias escolhas (o Ctrl+clique do Power BI). Cada marcação
 * vale na hora; cliques seguidos viram uma navegação só.
 *
 * `single`: só uma opção por vez; `max` não vale nele.
 * `required` (com `single`): a opção marcada não desmarca e não há "Limpar seleção".
 * `max`: acima dele o servidor corta a seleção sem avisar; aqui as opções não
 * marcadas travam e aparece o aviso. Sem `max`, não há limite.
 *
 * @example <MultiSelectCombobox id="mun" label="Município" plural="municípios" values={[]} options={opcoes} onChange={setMuns} max={100} />
 */
export const MultiSelectCombobox = (props: MultiSelectComboboxProps) => {
  const insideDialog = useContext(InsideDialogContext);
  const selection = useComboboxSelection(props.values, props.onChange, props);
  const popover = usePopoverState(selection.flush);
  const labelId = `${props.id}-label`;
  const summary = summarize(selection.selected, props.options, props.plural);

  return (
    <div className={props.fieldClassName ?? "flex min-w-0 flex-col gap-1"}>
      <span
        id={labelId}
        className={
          props.labelClassName ?? "text-sm font-semibold text-grey-1100"
        }
      >
        {props.label}
      </span>
      <Popover
        modal={insideDialog}
        open={popover.open}
        onOpenChange={popover.handleOpenChange}
      >
        <ComboboxTrigger
          id={props.id}
          labelId={labelId}
          summary={summary}
          className={props.triggerClassName}
          triggerRef={props.triggerRef}
        />
        <ComboboxPanel
          label={props.label}
          plural={props.plural}
          options={props.options}
          max={props.max}
          single={props.single}
          required={props.required}
          selection={selection}
          search={popover.search}
          onSearch={popover.setSearch}
        />
      </Popover>
    </div>
  );
};
