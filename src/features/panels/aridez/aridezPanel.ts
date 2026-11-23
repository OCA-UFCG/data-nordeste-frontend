import {
  ARIDEZ_CLASSES,
  asdShare,
  EMPTY_ARIDEZ_AREAS,
  type AridezAreas,
  type AridezClassKey,
} from "@/features/panels/aridez/aridezClasses";
import type {
  TerritorialFilters,
  YearRange,
} from "@/features/panels/territorialFilters";
import {
  resolveTerritorialSelection,
  type TerritorialSelection,
} from "@/features/panels/territorialOptions";
import {
  buildTerritorialWhere,
  toNumber,
  type NumericCell,
  type SqlQuery,
} from "@/features/panels/territorialSql";

// Os anos de `ano_consolidacao` em meio_aridez.vw_aridez (conferido no banco
// em 23/11/2026).
export const ARIDEZ_YEAR_RANGE: YearRange = {
  first: 1991,
  last: 2021,
  available: [2021, 2011, 2001, 1991],
};

// Ano de comparação do "Veja mais" (o protótipo escreve "1990").
export const ARIDEZ_BASE_YEAR = 1991;

// Limita o tamanho da URL e do array do `= ANY($n)`, como nos outros painéis.
export const ARIDEZ_MAX_PLACES = 100;

// Um estado da área no mapa: `value` é o % da área classificada que é ASD.
export type AridezStateRegion = {
  code: string;
  name: string;
  areas: AridezAreas;
  value: number;
};

export type AridezMunicipio = {
  cdMun: string;
  nome: string;
  areas: AridezAreas;
};

// `areas` e `baseAreas` são null quando o território não tem área classificada
// no ano (escolhido e de comparação, respectivamente).
export type AridezPanelData = TerritorialSelection & {
  areas: AridezAreas | null;
  baseAreas: AridezAreas | null;
  estados: AridezStateRegion[];
  porMunicipio: AridezMunicipio[];
};

/**
 * Painel sem dados: a página o usa quando a consulta falha, para os cards
 * mostrarem o erro com "Tentar de novo".
 *
 * @example emptyAridezPanel(filters).areas // null
 */
export const emptyAridezPanel = (
  filters: TerritorialFilters,
): AridezPanelData => ({
  filters,
  ufs: [],
  municipios: [],
  areas: null,
  baseAreas: null,
  estados: [],
  porMunicipio: [],
});

// Uma linha por município, ano e classe, com as colunas que
// `buildTerritorialWhere` espera. vw_aridez já traz UF, nome e as marcas de
// área (ne, semi_21, caat_24, aas_21), iguais às da view do PIB (conferido no
// banco em 23/11/2026): sem JOIN, a consulta não varre a view do PIB.
const ARIDEZ_VIEW = `(SELECT TRIM(cd_mun::text) AS cd_mun, sigla_uf,
    uf AS estado_uf, nm_mun || ' (' || sigla_uf || ')' AS municipio_uf,
    ne AS nordeste, semi_21 AS semiarido, caat_24 AS caatinga, aas_21 AS sudene,
    ano_consolidacao AS ano, dn_uni::text AS classe, area_km2_classe AS area
  FROM meio_aridez.vw_aridez) aridez`;

// `resolveTerritorialSelection` lista municípios linha a linha: aqui, uma por
// município e ano.
const ARIDEZ_TERRITORY_VIEW = `(SELECT DISTINCT cd_mun, sigla_uf, estado_uf,
    municipio_uf, nordeste, semiarido, caatinga, sudene, ano
  FROM ${ARIDEZ_VIEW}) aridez_municipios`;

// DO NOT CHANGE: os códigos vêm de ARIDEZ_CLASSES (constante), nunca da URL.
const CLASS_SUMS = ARIDEZ_CLASSES.map(
  ({ key, code }) =>
    `COALESCE(SUM(area) FILTER (WHERE classe = '${code}'), 0) AS ${key}`,
).join(", ");

type ClassRow = Record<AridezClassKey, NumericCell>;

const toAreas = (row: ClassRow): AridezAreas =>
  ARIDEZ_CLASSES.reduce<AridezAreas>(
    (areas, { key }) => ({ ...areas, [key]: toNumber(row[key]) }),
    EMPTY_ARIDEZ_AREAS,
  );

const hasArea = (areas: AridezAreas) =>
  Object.values(areas).some((value) => value > 0);

// O ano escolhido e o de comparação numa consulta só, uma linha por ano.
const loadAreasByYear = async (
  query: SqlQuery,
  filters: TerritorialFilters,
): Promise<Map<number, AridezAreas>> => {
  const where = buildTerritorialWhere(filters, {
    byYear: false,
    byMunicipality: true,
  });
  const years = [...new Set([filters.ano, ARIDEZ_BASE_YEAR])];
  const rows = await query<ClassRow & { ano: number }>(
    `SELECT ano, ${CLASS_SUMS} FROM ${ARIDEZ_VIEW}
     WHERE ${where.sql} AND ano = ANY($${where.params.length + 1})
     GROUP BY ano`,
    [...where.params, years],
  );

  return new Map(rows.map((row) => [Number(row.ano), toAreas(row)]));
};

const areasOrNull = (byYear: Map<number, AridezAreas>, ano: number) => {
  const areas = byYear.get(ano);

  return areas && hasArea(areas) ? areas : null;
};

// Como no PIB: o mapa mostra todos os estados da área, com ou sem estado no
// filtro, e por isso ignora UF e município.
const loadEstados = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(
    { ano: filters.ano, area: filters.area },
    { byYear: true, byMunicipality: false },
  );
  const rows = await query<ClassRow & { sigla_uf: string; estado_uf: string }>(
    `SELECT sigla_uf, estado_uf, ${CLASS_SUMS} FROM ${ARIDEZ_VIEW}
     WHERE ${where.sql} GROUP BY sigla_uf, estado_uf ORDER BY estado_uf`,
    where.params,
  );

  return rows.map((row) => {
    const areas = toAreas(row);

    return {
      code: row.sigla_uf.trim(),
      name: row.estado_uf,
      areas,
      value: asdShare(areas),
    };
  });
};

const loadPorMunicipio = async (
  query: SqlQuery,
  filters: TerritorialFilters,
): Promise<AridezMunicipio[]> => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: true,
  });
  const rows = await query<ClassRow & { cd_mun: string; municipio_uf: string }>(
    `SELECT cd_mun, municipio_uf, ${CLASS_SUMS} FROM ${ARIDEZ_VIEW}
     WHERE ${where.sql} GROUP BY cd_mun, municipio_uf ORDER BY municipio_uf`,
    where.params,
  );

  return rows
    .map((row) => ({
      cdMun: row.cd_mun,
      nome: row.municipio_uf,
      areas: toAreas(row),
    }))
    .filter((row) => hasArea(row.areas));
};

/**
 * Dados do painel de aridez para os filtros da URL: as opções de Estado e
 * Município, a área por classe no ano escolhido e no de comparação, o mapa por
 * estado e a divisão de cada município entre as classes.
 *
 * @example await loadAridezPanel(queryDataDb, { ano: 2021, area: "nordeste" })
 */
export const loadAridezPanel = async (
  query: SqlQuery,
  requested: TerritorialFilters,
): Promise<AridezPanelData> => {
  const selection = await resolveTerritorialSelection(
    query,
    ARIDEZ_TERRITORY_VIEW,
    requested,
  );
  const { filters } = selection;
  const [byYear, estados, porMunicipio] = await Promise.all([
    loadAreasByYear(query, filters),
    loadEstados(query, filters),
    loadPorMunicipio(query, filters),
  ]);

  return {
    ...selection,
    areas: areasOrNull(byYear, filters.ano),
    baseAreas: areasOrNull(byYear, ARIDEZ_BASE_YEAR),
    estados,
    porMunicipio,
  };
};
