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

export const DEMOGRAFIA_YEAR_RANGE: YearRange = {
  first: 2000,
  last: 2022,
  available: [2022, 2010, 2000],
};

export const POPULACAO_MAP_BUCKETS: readonly ChoroplethBucket[] = [
  { max: 1e4, label: "Até 10 mil", color: "#f9eaf1" },
  { max: 2e4, label: "10 a 20 mil", color: "#f6d4e3" },
  { max: 5e4, label: "20 a 50 mil", color: "#efb2cc" },
  { max: 1e5, label: "50 a 100 mil", color: "#e482a9" },
  { max: 5e5, label: "100 a 500 mil", color: "#c53d69" },
  { max: 1e6, label: "500 mil a 1 mi", color: "#8d2744" },
  { max: Infinity, label: "Acima de 1 mi", color: "#47101f" },
];

const AREA_ALIASES =
  "ne AS nordeste, semi_21 AS semiarido, caat_24 AS caatinga, aas_21 AS sudene";

// final_demografia tem uma linha por município, ano e faixa etária. Os aliases
// dão a ela os nomes de coluna que buildTerritorialWhere espera.
const DEMOGRAFIA_ROWS = `(SELECT cd_mun::text AS cd_mun, nm_mun, sigla_uf, ano,
    ${AREA_ALIASES}, classificador_idade, idade_agrupada, populacao_total,
    mulher, homem, branca, preta, amarela, parda, indigena
  FROM dem_demografia.final_demografia) AS demografia`;

// Uma linha por município e ano, no formato que resolveTerritorialSelection lê.
const DEMOGRAFIA_MUNICIPIOS = `(SELECT DISTINCT cd_mun::text AS cd_mun,
    nm_mun || ' (' || sigla_uf || ')' AS municipio_uf, sigla_uf,
    uf AS estado_uf, ano, ${AREA_ALIASES}
  FROM dem_demografia.final_demografia) AS municipios`;

export type PopulacaoPorFaixa = {
  faixa: string;
  mulheres: number;
  homens: number;
};

export type DemografiaPanelData = TerritorialSelection & {
  serie: ChartPoint[];
  sexo: { mulheres: number; homens: number };
  corRaca: ChartPoint[];
  piramide: PopulacaoPorFaixa[];
  mapa: ChoroplethRegion[];
};

const loadSerie = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: false,
    byMunicipality: true,
  });
  const rows = await query<{ ano: number; populacao: NumericCell }>(
    `SELECT ano, SUM(populacao_total) AS populacao FROM ${DEMOGRAFIA_ROWS}
     WHERE ${where.sql} GROUP BY ano ORDER BY ano`,
    where.params,
  );

  return rows.map((row) => ({
    label: String(row.ano),
    value: toNumber(row.populacao),
  }));
};

const COR_RACA = [
  { column: "parda", label: "Parda" },
  { column: "branca", label: "Branca" },
  { column: "preta", label: "Preta" },
  { column: "indigena", label: "Indígena" },
  { column: "amarela", label: "Amarela" },
] as const;

// Cor ou raça soma só quem declarou; por isso fica um pouco abaixo do total.
const loadComposicao = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: true,
  });
  const columns = ["mulher", "homem", ...COR_RACA.map(({ column }) => column)];
  const sums = columns
    .map((column) => `SUM(${column}) AS ${column}`)
    .join(", ");
  const [row] = await query<Record<string, NumericCell>>(
    `SELECT ${sums} FROM ${DEMOGRAFIA_ROWS} WHERE ${where.sql}`,
    where.params,
  );
  const value = (column: string) => toNumber(row?.[column] ?? null);

  return {
    sexo: { mulheres: value("mulher"), homens: value("homem") },
    corRaca: COR_RACA.map(({ column, label }) => ({
      label,
      value: value(column),
    })).sort((a, b) => b.value - a.value),
  };
};

const loadPiramide = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: true,
  });
  const rows = await query<{
    faixa: string;
    mulheres: NumericCell;
    homens: NumericCell;
  }>(
    `SELECT idade_agrupada AS faixa, SUM(mulher) AS mulheres, SUM(homem) AS homens
     FROM ${DEMOGRAFIA_ROWS} WHERE ${where.sql}
     GROUP BY classificador_idade, idade_agrupada ORDER BY classificador_idade`,
    where.params,
  );

  return rows.map((row) => ({
    faixa: row.faixa,
    mulheres: toNumber(row.mulheres),
    homens: toNumber(row.homens),
  }));
};

const loadMapa = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: false,
  });
  const rows = await query<{
    cd_mun: string;
    nm_mun: string;
    sigla_uf: string;
    populacao: NumericCell;
  }>(
    `SELECT cd_mun, nm_mun, sigla_uf, SUM(populacao_total) AS populacao
     FROM ${DEMOGRAFIA_ROWS} WHERE ${where.sql}
     GROUP BY cd_mun, nm_mun, sigla_uf`,
    where.params,
  );

  return rows.map((row) => ({
    code: row.cd_mun,
    name: row.nm_mun,
    uf: row.sigla_uf,
    value: toNumber(row.populacao),
  }));
};

export const topMunicipios = (mapa: ChoroplethRegion[], limit = 5) =>
  [...mapa]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((region) => ({
      label: `${region.name} (${region.uf})`,
      value: region.value,
    }));

export const loadDemografiaPanel = async (
  query: SqlQuery,
  requested: TerritorialFilters,
): Promise<DemografiaPanelData> => {
  const selection = await resolveTerritorialSelection(
    query,
    DEMOGRAFIA_MUNICIPIOS,
    requested,
  );
  const { filters } = selection;
  const [serie, composicao, piramide, mapa] = await Promise.all([
    loadSerie(query, filters),
    loadComposicao(query, filters),
    loadPiramide(query, filters),
    loadMapa(query, filters),
  ]);

  return { ...selection, ...composicao, serie, piramide, mapa };
};
