export const TERRITORIAL_AREAS = [
  { value: "nordeste", label: "Nordeste" },
  { value: "semiarido", label: "Semiárido" },
  { value: "caatinga", label: "Caatinga" },
  { value: "sudene", label: "Área da Sudene" },
] as const;

export type TerritorialArea = (typeof TERRITORIAL_AREAS)[number]["value"];

export type TerritorialFilters = {
  ano: number;
  area: TerritorialArea;
  uf?: string;
  mun?: string;
};

// `available` lista anos não contíguos (ex.: censos), do mais recente ao mais antigo.
export type YearRange = {
  first: number;
  last: number;
  available?: readonly number[];
};

export type SearchParams = Record<string, string | string[] | undefined>;

export const listYears = ({ first, last, available }: YearRange): number[] =>
  available
    ? [...available]
    : Array.from({ length: last - first + 1 }, (_, index) => last - index);

export const defaultTerritorialFilters = (
  range: YearRange,
): TerritorialFilters => ({ ano: range.last, area: "nordeste" });

export const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const UF_PATTERN = /^[A-Z]{2}$/;

const isTerritorialArea = (value?: string): value is TerritorialArea =>
  TERRITORIAL_AREAS.some((area) => area.value === value);

export const parseTerritorialFilters = (
  params: SearchParams,
  range: YearRange,
): TerritorialFilters => {
  const defaults = defaultTerritorialFilters(range);
  const ano = Number(firstValue(params.ano));
  const area = firstValue(params.area);
  const uf = firstValue(params.uf)?.toUpperCase();
  const mun = firstValue(params.mun);

  return {
    ano: listYears(range).includes(ano) ? ano : defaults.ano,
    area: isTerritorialArea(area) ? area : defaults.area,
    ...(uf && UF_PATTERN.test(uf) ? { uf } : {}),
    ...(mun && /^\d{7}$/.test(mun) ? { mun } : {}),
  };
};

export const buildTerritorialSearch = (
  filters: TerritorialFilters,
  range: YearRange,
): string => {
  const defaults = defaultTerritorialFilters(range);
  const params = new URLSearchParams();

  if (filters.ano !== defaults.ano) params.set("ano", String(filters.ano));
  if (filters.area !== defaults.area) params.set("area", filters.area);
  if (filters.uf) params.set("uf", filters.uf);
  if (filters.mun) params.set("mun", filters.mun);
  const search = params.toString();

  return search ? `?${search}` : "";
};
