"use client";
import type { PibPanel, PibPanelSelection } from "@/features/panels/pibPanel";

type SelectOption = { value: string; label: string };

const ALL_VALUE = "";

/**
 * Ano, Área, Estado e Município, in the Power BI panel's order. Changing a
 * broader filter clears the narrower ones, since their options depend on it.
 * Example: `<PibFilters panel={panel} year={2023} onYearChange={setYear} onSelect={select} />`.
 */
const PibFilters = ({
  panel,
  year,
  onYearChange,
  onSelect,
}: {
  panel: PibPanel;
  year: number;
  onYearChange: (year: number) => void;
  onSelect: (selection: PibPanelSelection) => void;
}) => {
  const { selection, options } = panel;

  return (
    <div className="sticky top-0 z-10 grid grid-cols-2 gap-3 border-b border-orange-200 bg-white py-3">
      <FilterSelect
        label="Ano"
        value={String(year)}
        options={yearOptions(panel)}
        onChange={(value) => onYearChange(Number(value))}
      />
      <FilterSelect
        label="Área de interesse"
        value={selection.area}
        options={options.areas.map(({ id, name }) => ({
          value: id,
          label: name,
        }))}
        onChange={(area) => onSelect({ area, uf: null, municipio: null })}
      />
      <FilterSelect
        label="Estado"
        value={selection.uf ?? ALL_VALUE}
        options={withAllOption(
          options.ufs.map((uf) => ({ value: uf, label: uf })),
        )}
        onChange={(uf) =>
          onSelect({ ...selection, uf: uf || null, municipio: null })
        }
      />
      <FilterSelect
        label="Município"
        value={selection.municipio ? String(selection.municipio) : ALL_VALUE}
        options={withAllOption(municipalityOptions(panel))}
        disabled={!selection.uf}
        onChange={(code) =>
          onSelect({ ...selection, municipio: code ? Number(code) : null })
        }
      />
    </div>
  );
};

const yearOptions = (panel: PibPanel): SelectOption[] =>
  [...panel.series]
    .reverse()
    .map(({ ano }) => ({ value: String(ano), label: String(ano) }));

const municipalityOptions = (panel: PibPanel): SelectOption[] =>
  panel.options.municipalities.map(({ code, name }) => ({
    value: String(code),
    label: name,
  }));

const withAllOption = (options: SelectOption[]): SelectOption[] => [
  { value: ALL_VALUE, label: "Todos" },
  ...options,
];

const FilterSelect = ({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) => (
  <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-[#5b5b5b]">
    {label}
    <select
      className="h-10 w-full truncate rounded-md border border-orange-300 bg-white px-2 text-sm text-[#292829] disabled:bg-[#f5f5f5] disabled:text-[#9a9a9a]"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export default PibFilters;
