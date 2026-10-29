import type { ChoroplethBucket } from "@/features/panels/choropleth";
import type {
  ChartPoint,
  ChoroplethRegion,
} from "@/features/panels/chartOptions";
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

// Último ano com VAB publicado pelo IBGE; o aviso do Power BI cita 2022 e 2023.
export const PIB_VAB_LAST_YEAR = 2021;

// Faixas, rótulos e cores da legenda do mapa no Power BI.
export const PIB_MAP_BUCKETS: readonly ChoroplethBucket[] = [
  { max: 5e8, label: "< 500 Mi", color: "#fff7ed" },
  { max: 1e9, label: "500 Mi - 1 Bi", color: "#fcd9ac" },
  { max: 5e9, label: "1 Bi - 5 Bi", color: "#f79339" },
  { max: 1e10, label: "5 Bi - 10 Bi", color: "#e65e10" },
  { max: 2e10, label: "10 Bi - 20 Bi", color: "#be4610" },
  { max: 3.5e10, label: "20 Bi - 35 Bi", color: "#7a3014" },
  { max: Infinity, label: "> 35 Bi", color: "#421608" },
];

export type PibYearPoint = { ano: number; pib: number; perCapita: number };

export type PibMapRegion = ChoroplethRegion & { atividade?: string };

export type PibPanelData = TerritorialSelection & {
  serie: PibYearPoint[];
  mapa: PibMapRegion[];
  vab: ChartPoint[] | null;
  atividades: ChartPoint[];
};

/**
 * Nenhum dos dois gráficos de setor (VAB e participação) tem dados no filtro:
 * o painel mostra um aviso só, em vez de dois iguais.
 *
 * @example lacksSectorData({ ...panel, vab: null, atividades: [] }) // true
 */
export const lacksSectorData = (
  data: Pick<PibPanelData, "vab" | "atividades">,
): boolean => !data.vab && data.atividades.length === 0;

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

const loadMapa = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: false,
  });
  const rows = await query<{
    cd_mun: string;
    nome_municipio: string;
    sigla_uf: string;
    pib_total: NumericCell;
    atividade_maior_vab: string | null;
  }>(
    `SELECT TRIM(cd_mun) AS cd_mun, nome_municipio, sigla_uf, pib_total,
       atividade_maior_vab
     FROM ${PIB_VIEW} WHERE ${where.sql}`,
    where.params,
  );

  return rows.map((row) => ({
    code: row.cd_mun,
    name: row.nome_municipio,
    uf: row.sigla_uf,
    value: toNumber(row.pib_total),
    atividade: row.atividade_maior_vab ?? undefined,
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
  const [serie, mapa, vab, atividades] = await Promise.all([
    loadSerie(query, filters),
    loadMapa(query, filters),
    loadVab(query, filters),
    loadAtividades(query, filters),
  ]);

  return { ...selection, serie, mapa, vab, atividades };
};
