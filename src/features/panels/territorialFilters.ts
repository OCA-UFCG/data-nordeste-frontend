export const TERRITORIAL_AREAS = [
  { value: "nordeste", label: "Nordeste" },
  { value: "semiarido", label: "Semiárido" },
  { value: "caatinga", label: "Caatinga" },
  { value: "sudene", label: "Área da Sudene" },
] as const;

export type TerritorialArea = (typeof TERRITORIAL_AREAS)[number]["value"];

// Listas: o PIB aceita vários; o Perfil Demográfico usa no máximo um.
export type TerritorialFilters = {
  ano: number;
  area: TerritorialArea;
  uf?: string[];
  mun?: string[];
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

const MUNICIPALITY_PATTERN = /^\d{7}$/;

/**
 * Reads a comma-separated list of IBGE municipality codes, dropping invalid
 * and repeated ones. A single code (the old `?mun=` links) still works.
 * @example parseMunicipalityCodes("2611606,abc,2611606,2304400") // ["2611606", "2304400"]
 */
export const parseMunicipalityCodes = (value?: string): string[] => [
  ...new Set(
    (value ?? "").split(",").filter((code) => MUNICIPALITY_PATTERN.test(code)),
  ),
];

export const serializeMunicipalityCodes = (codes: string[]): string =>
  codes.join(",");

const isTerritorialArea = (value?: string): value is TerritorialArea =>
  TERRITORIAL_AREAS.some((area) => area.value === value);

// Valida e tira repetidos antes de cortar, como o servidor conta o limite: um
// link com 100 códigos válidos e alguns inválidos mantém os 100 válidos.
const parseCodes = (
  value: string | string[] | undefined,
  pattern: RegExp,
  limit: number,
): string[] | undefined => {
  const valid = [value ?? []]
    .flat()
    .map((code) => code.toUpperCase())
    .filter((code) => pattern.test(code));
  const codes = [...new Set(valid)].slice(0, limit);

  return codes.length ? codes : undefined;
};

/**
 * Lê ano, área, UFs e municípios da URL, descartando o que não tem o formato esperado.
 * `maxPlaces` limita quantas UFs/municípios entram; 1 mantém o filtro de valor único.
 *
 * @example parseTerritorialFilters({ uf: ["PB", "PE"] }, range, 100).uf // ["PB", "PE"]
 */
export const parseTerritorialFilters = (
  params: SearchParams,
  range: YearRange,
  maxPlaces = 1,
): TerritorialFilters => {
  const defaults = defaultTerritorialFilters(range);
  const ano = Number(firstValue(params.ano));
  const area = firstValue(params.area);
  const uf = parseCodes(params.uf, UF_PATTERN, maxPlaces);
  const mun = parseCodes(params.mun, MUNICIPALITY_PATTERN, maxPlaces);

  return {
    ano: listYears(range).includes(ano) ? ano : defaults.ano,
    area: isTerritorialArea(area) ? area : defaults.area,
    ...(uf ? { uf } : {}),
    ...(mun ? { mun } : {}),
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

  // Vários valores repetem o parâmetro (`?uf=PB&uf=PE`); com um só, a URL é a
  // mesma de antes (`?uf=PB`), então links já compartilhados seguem valendo.
  filters.uf?.forEach((uf) => params.append("uf", uf));
  filters.mun?.forEach((mun) => params.append("mun", mun));
  const search = params.toString();

  return search ? `?${search}` : "";
};
