import type { ChartPoint } from "@/features/panels/chartBase";
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

export const PIB_YEAR_RANGE: YearRange = { first: 2010, last: 2023 };

// Limita o tamanho da URL e do array do `= ANY($n)`.
export const PIB_MAX_PLACES = 100;

// Último ano com VAB publicado pelo IBGE; o aviso do painel cita 2022 e 2023.
export const PIB_VAB_LAST_YEAR = 2021;

/**
 * Anos do painel que ainda não têm VAB (os posteriores a `PIB_VAB_LAST_YEAR`),
 * para o aviso dos cards de setor.
 *
 * @example listPibYearsWithoutVab() // [2022, 2023]
 */
export const listPibYearsWithoutVab = (): number[] =>
  Array.from(
    { length: PIB_YEAR_RANGE.last - PIB_VAB_LAST_YEAR },
    (_, index) => PIB_VAB_LAST_YEAR + 1 + index,
  );

export type PibYearPoint = { ano: number; pib: number; perCapita: number };

// PIB total de um estado dentro da área de interesse, no ano do filtro.
export type PibStateRegion = { code: string; name: string; value: number };

export type PibPanelData = TerritorialSelection & {
  serie: PibYearPoint[];
  estados: PibStateRegion[];
  vab: ChartPoint[] | null;
  atividades: ChartPoint[];
};

/**
 * Painel sem dados: a página o usa quando a consulta falha, para os cards
 * mostrarem o erro com "Tentar de novo" no lugar dos gráficos.
 *
 * @example emptyPibPanel(filters).serie // []
 */
export const emptyPibPanel = (filters: TerritorialFilters): PibPanelData => ({
  filters,
  ufs: [],
  municipios: [],
  serie: [],
  estados: [],
  vab: null,
  atividades: [],
});

const PIB_VIEW = "eco_pib.vw_pib_municipal_pbi";

const loadSerie = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: false,
    byMunicipality: true,
  });
  const rows = await query<{
    ano: number;
    pib: NumericCell;
    per_capita: NumericCell;
  }>(
    `SELECT ano, SUM(pib_total) AS pib,
       SUM(pib_total) FILTER (WHERE pib_per_capita > 0)
         / NULLIF(SUM(pib_total / pib_per_capita) FILTER (WHERE pib_per_capita > 0), 0)
         AS per_capita
     FROM ${PIB_VIEW} WHERE ${where.sql} GROUP BY ano ORDER BY ano`,
    where.params,
  );

  return rows.map((row) => ({
    ano: row.ano,
    pib: toNumber(row.pib),
    perCapita: toNumber(row.per_capita),
  }));
};

// O mapa mostra todos os estados da área, com ou sem estado no filtro: o
// estado escolhido só ganha o contorno. Por isso a consulta ignora UF e
// município e soma os municípios de cada estado.
const loadEstados = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(
    { ano: filters.ano, area: filters.area },
    { byYear: true, byMunicipality: false },
  );
  const rows = await query<{
    sigla_uf: string;
    estado_uf: string;
    pib: NumericCell;
  }>(
    `SELECT sigla_uf, estado_uf, SUM(pib_total) AS pib
     FROM ${PIB_VIEW} WHERE ${where.sql}
     GROUP BY sigla_uf, estado_uf ORDER BY estado_uf`,
    where.params,
  );

  return rows.map((row) => ({
    code: row.sigla_uf.trim(),
    name: row.estado_uf,
    value: toNumber(row.pib),
  }));
};

const VAB_SECTORS = [
  { column: "vab_agropecuaria", label: "Agropecuária" },
  { column: "vab_industria", label: "Indústria" },
  { column: "vab_adm_publica", label: "Administração Pública" },
  { column: "vab_servicos", label: "Serviços" },
] as const;

const loadVab = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: true,
  });
  const sums = VAB_SECTORS.map(
    ({ column }) => `SUM(${column}) AS ${column}`,
  ).join(", ");
  const [row] = await query<Record<string, NumericCell>>(
    `SELECT ${sums} FROM ${PIB_VIEW} WHERE ${where.sql}`,
    where.params,
  );

  if (!row || row.vab_servicos === null) return null;

  // Colunas de VAB estão em R$ mil.
  return VAB_SECTORS.map(({ column, label }) => ({
    label,
    value: toNumber(row[column]) * 1000,
  })).sort((a, b) => b.value - a.value);
};

const loadAtividades = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: true,
  });
  const rows = await query<{ atividade: string; participacao: NumericCell }>(
    `SELECT atividade_maior_vab AS atividade,
       100.0 * SUM(vab_setor_maior) / NULLIF(SUM(SUM(pib)) OVER (), 0) AS participacao
     FROM ${PIB_VIEW} WHERE ${where.sql} AND atividade_maior_vab IS NOT NULL
     GROUP BY atividade_maior_vab ORDER BY participacao DESC`,
    where.params,
  );

  return rows.map((row) => ({
    label: row.atividade,
    value: toNumber(row.participacao),
  }));
};

export const loadPibPanel = async (
  query: SqlQuery,
  requested: TerritorialFilters,
): Promise<PibPanelData> => {
  const selection = await resolveTerritorialSelection(
    query,
    PIB_VIEW,
    requested,
  );
  const { filters } = selection;
  const [serie, estados, vab, atividades] = await Promise.all([
    loadSerie(query, filters),
    loadEstados(query, filters),
    loadVab(query, filters),
    loadAtividades(query, filters),
  ]);

  return { ...selection, serie, estados, vab, atividades };
};
