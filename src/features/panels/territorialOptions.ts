import {
  TERRITORIAL_AREAS,
  type TerritorialArea,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import {
  buildTerritorialWhere,
  type SqlQuery,
} from "@/features/panels/territorialSql";

export type UfOption = { sigla: string; nome: string };
export type MunicipalityOption = { cdMun: string; nome: string };

export type TerritorialSelection = {
  filters: TerritorialFilters;
  ufs: UfOption[];
  municipios: MunicipalityOption[];
};

const loadUfs = async (
  query: SqlQuery,
  view: string,
  filters: TerritorialFilters,
): Promise<UfOption[]> => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: false,
  });
  const rows = await query<{ sigla_uf: string; estado_uf: string }>(
    `SELECT DISTINCT sigla_uf, estado_uf FROM ${view}
     WHERE ${where.sql} ORDER BY estado_uf`,
    where.params,
  );

  return rows.map((row) => ({ sigla: row.sigla_uf, nome: row.estado_uf }));
};

const loadMunicipios = async (
  query: SqlQuery,
  view: string,
  filters: TerritorialFilters,
): Promise<MunicipalityOption[]> => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: false,
  });
  const rows = await query<{ cd_mun: string; municipio_uf: string }>(
    `SELECT TRIM(cd_mun) AS cd_mun, municipio_uf FROM ${view}
     WHERE ${where.sql} ORDER BY municipio_uf`,
    where.params,
  );

  return rows.map((row) => ({ cdMun: row.cd_mun, nome: row.municipio_uf }));
};

// A URL pode trazer UF ou município fora da área/ano; só fica o que existe nas opções.
const keepKnown = (requested: string[] | undefined, known: string[]) => {
  const kept = requested?.filter((code) => known.includes(code));

  return kept?.length ? kept : undefined;
};

// A view precisa ter sigla_uf, estado_uf, cd_mun, municipio_uf, ano e as colunas de área.
export const resolveTerritorialSelection = async (
  query: SqlQuery,
  view: string,
  requested: TerritorialFilters,
): Promise<TerritorialSelection> => {
  const base = { ano: requested.ano, area: requested.area };
  const ufs = await loadUfs(query, view, base);
  const uf = keepKnown(
    requested.uf,
    ufs.map((item) => item.sigla),
  );
  const scoped: TerritorialFilters = uf ? { ...base, uf } : base;

  const municipios = await loadMunicipios(query, view, scoped);
  const mun = keepKnown(
    requested.mun,
    municipios.map((item) => item.cdMun),
  );

  return { filters: mun ? { ...scoped, mun } : scoped, ufs, municipios };
};

const MAX_NAMED_PLACES = 2;

const describeMunicipios = (names: string[], ufs?: string[]) => {
  if (names.length <= MAX_NAMED_PLACES) return names.join(" e ");
  const scope = ufs ? ` (${ufs.join(", ")})` : "";

  return `${names.length} municípios${scope}`;
};

const describeUfs = (names: string[]) =>
  names.length <= MAX_NAMED_PLACES
    ? names.join(" e ")
    : `${names.length} estados`;

/**
 * Nome da área de interesse, como aparece nos selects ("Área da Sudene").
 *
 * @example areaLabel("nordeste") // "Nordeste"
 */
export const areaLabel = (area: TerritorialArea): string =>
  TERRITORIAL_AREAS.find((item) => item.value === area)?.label ?? area;

/**
 * Nomes dos estados escolhidos, na ordem das opções carregadas.
 *
 * @example selectedUfNames(selection) // ["Paraíba", "Pernambuco"]
 */
export const selectedUfNames = ({
  filters,
  ufs,
}: TerritorialSelection): string[] =>
  ufs
    .filter((item) => filters.uf?.includes(item.sigla))
    .map((item) => item.nome);

/**
 * Nomes dos municípios escolhidos, na ordem das opções carregadas.
 *
 * @example selectedMunicipioNames(selection) // ["Recife (PE)"]
 */
export const selectedMunicipioNames = ({
  filters,
  municipios,
}: TerritorialSelection): string[] =>
  municipios
    .filter((item) => filters.mun?.includes(item.cdMun))
    .map((item) => item.nome);

/**
 * Resumo dos estados escolhidos ("Pernambuco", "3 estados"), ou null sem UF.
 *
 * @example describeSelectedUfs(selection) // "3 estados"
 */
export const describeSelectedUfs = (
  selection: TerritorialSelection,
): string | null => {
  const names = selectedUfNames(selection);

  return names.length ? describeUfs(names) : null;
};

/**
 * Resumo dos municípios escolhidos ("Recife (PE)", "3 municípios (PB, PE)"),
 * ou null sem município.
 *
 * @example describeSelectedMunicipios(selection) // "3 municípios (PB, PE)"
 */
export const describeSelectedMunicipios = (
  selection: TerritorialSelection,
): string | null => {
  const names = selectedMunicipioNames(selection);

  return names.length ? describeMunicipios(names, selection.filters.uf) : null;
};

const describePlace = (selection: TerritorialSelection, nameArea: boolean) => {
  const municipios = describeSelectedMunicipios(selection);

  if (municipios) return municipios;

  const ufs = describeSelectedUfs(selection);

  if (ufs) return ufs;

  return nameArea
    ? areaLabel(selection.filters.area)
    : "Todos os municípios da área";
};

/**
 * Texto do "Mostrando: …": o lugar mais específico escolhido e o ano.
 *
 * `nameArea`: sem UF nem município, mostra o nome da área ("Nordeste · 2021").
 *
 * @example describeTerritorialSelection(selection) // "3 municípios (PB, PE) · 2021"
 */
export const describeTerritorialSelection = (
  selection: TerritorialSelection,
  nameArea = false,
): string => `${describePlace(selection, nameArea)} · ${selection.filters.ano}`;
