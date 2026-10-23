import {
  firstValue,
  listYears,
  parseMunicipalityCodes,
  serializeMunicipalityCodes,
  UF_PATTERN,
  type SearchParams,
  type YearRange,
} from "@/features/panels/territorialFilters";

export const FNE_YEAR_RANGE: YearRange = { first: 2021, last: 2025 };

export const FNE_VISOES = [
  { key: "quantidade", label: "Quantidade de contratações" },
  { key: "valor", label: "Valor de contratações" },
] as const;

export type FneVisao = (typeof FNE_VISOES)[number]["key"];

export const FNE_SEMIARIDO = [
  { value: "sim", label: "Semiárido" },
  { value: "nao", label: "Fora do Semiárido" },
] as const;

export type FneSemiarido = (typeof FNE_SEMIARIDO)[number]["value"];

// Valores exatos da coluna bioma; a URL só passa se estiver nesta lista.
export const FNE_BIOMAS = [
  "Amazônia",
  "Caatinga",
  "Cerrado",
  "Mata Atlântica",
] as const;

export type FneBioma = (typeof FNE_BIOMAS)[number];

export type FneFilters = {
  ano: number;
  visao: FneVisao;
  semiarido?: FneSemiarido;
  bioma?: FneBioma;
  uf?: string;
  muns: string[];
};

export const DEFAULT_FNE_FILTERS: FneFilters = {
  ano: FNE_YEAR_RANGE.last,
  visao: "quantidade",
  muns: [],
};

const isVisao = (value?: string): value is FneVisao =>
  FNE_VISOES.some((visao) => visao.key === value);

const isSemiarido = (value?: string): value is FneSemiarido =>
  FNE_SEMIARIDO.some((option) => option.value === value);

const isBioma = (value?: string): value is FneBioma =>
  FNE_BIOMAS.some((bioma) => bioma === value);

const parseAno = (value?: string): number => {
  const ano = Number(value);

  return listYears(FNE_YEAR_RANGE).includes(ano)
    ? ano
    : DEFAULT_FNE_FILTERS.ano;
};

/**
 * Reads the panel filters from the URL, dropping anything out of range.
 * @example parseFneFilters({ ano: "2023", mun: "2611606,2607901" }) // { ano: 2023, visao: "quantidade", muns: ["2611606", "2607901"] }
 */
export const parseFneFilters = (params: SearchParams): FneFilters => {
  const visao = firstValue(params.visao);
  const semiarido = firstValue(params.semiarido);
  const bioma = firstValue(params.bioma);
  const uf = firstValue(params.uf)?.toUpperCase();

  return {
    ano: parseAno(firstValue(params.ano)),
    visao: isVisao(visao) ? visao : DEFAULT_FNE_FILTERS.visao,
    ...(isSemiarido(semiarido) ? { semiarido } : {}),
    ...(isBioma(bioma) ? { bioma } : {}),
    ...(uf && UF_PATTERN.test(uf) ? { uf } : {}),
    muns: parseMunicipalityCodes(firstValue(params.mun)),
  };
};

export const buildFneSearch = (filters: FneFilters): string => {
  const params = new URLSearchParams();

  if (filters.ano !== DEFAULT_FNE_FILTERS.ano) {
    params.set("ano", String(filters.ano));
  }
  if (filters.semiarido) params.set("semiarido", filters.semiarido);
  if (filters.bioma) params.set("bioma", filters.bioma);
  if (filters.uf) params.set("uf", filters.uf);
  if (filters.muns.length) {
    params.set("mun", serializeMunicipalityCodes(filters.muns));
  }
  if (filters.visao !== DEFAULT_FNE_FILTERS.visao) {
    params.set("visao", filters.visao);
  }
  const search = params.toString();

  return search ? `?${search}` : "";
};
