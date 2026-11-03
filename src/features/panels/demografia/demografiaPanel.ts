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

export const DEMOGRAFIA_MAX_PLACES = 100;

export type DemografiaPorte = ChoroplethBucket & { texto: string };

export const DEMOGRAFIA_PORTES: readonly DemografiaPorte[] = [
  {
    max: 5e4,
    label: "Pequeno",
    color: "#efcfdc",
    texto: "Pequeno porte (até 50 mil hab.)",
  },
  {
    max: 1e5,
    label: "Médio",
    color: "#e7a4bf",
    texto: "Médio porte (50 mil - 100 mil hab.)",
  },
  {
    max: Infinity,
    label: "Grande",
    color: "#e482a9",
    texto: "Grande porte (acima de 100 mil hab.)",
  },
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

export type CorRacaAno = { ano: number; corRaca: ChartPoint[] };

export type DemografiaPanelData = TerritorialSelection & {
  serie: ChartPoint[];
  sexo: { mulheres: number; homens: number };
  corRaca: ChartPoint[];
  corRacaAnterior: CorRacaAno | null;
  piramide: PopulacaoPorFaixa[];
  mapa: ChoroplethRegion[];
};

const COR_RACA = [
  { column: "amarela", label: "Amarela" },
  { column: "branca", label: "Branca" },
  { column: "indigena", label: "Indígena" },
  { column: "parda", label: "Parda" },
  { column: "preta", label: "Preta" },
] as const;

type AnoRow = Record<string, NumericCell>;

// Uma linha por censo: a série não segue o filtro de ano, e o resto sai da
// linha do ano escolhido.
const loadPorAno = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: false,
    byMunicipality: true,
  });
  const columns = [
    "populacao_total",
    "mulher",
    "homem",
    ...COR_RACA.map(({ column }) => column),
  ];
  const sums = columns
    .map((column) => `SUM(${column}) AS ${column}`)
    .join(", ");

  return query<AnoRow>(
    `SELECT ano, ${sums} FROM ${DEMOGRAFIA_ROWS}
     WHERE ${where.sql} GROUP BY ano ORDER BY ano`,
    where.params,
  );
};

const cell = (row: AnoRow | undefined, column: string) =>
  toNumber(row?.[column] ?? null);

// Cor ou raça soma só quem declarou; por isso fica um pouco abaixo do total.
const corRacaDe = (row: AnoRow | undefined): ChartPoint[] =>
  COR_RACA.map(({ column, label }) => ({ label, value: cell(row, column) }));

// O Figma agrupa a pirâmide por décadas; a tabela tem 12 faixas
// (0-4, 5-9, ..., 25-29 de 5 em 5 anos, depois 30-39 ... 70-79 e 80+).
const FAIXAS_DECENAIS = [
  "0 a 9 anos",
  "10 a 19 anos",
  "20 a 29 anos",
  "30 a 39 anos",
  "40 a 49 anos",
  "50 a 59 anos",
  "60 a 69 anos",
  "70 a 79 anos",
  "80+ anos",
] as const;

const DECADA_SQL = `CASE WHEN classificador_idade <= 6
    THEN (classificador_idade + 1) / 2 ELSE classificador_idade - 3 END`;

const loadPiramide = async (query: SqlQuery, filters: TerritorialFilters) => {
  const where = buildTerritorialWhere(filters, {
    byYear: true,
    byMunicipality: true,
  });
  const rows = await query<{
    decada: number;
    mulheres: NumericCell;
    homens: NumericCell;
  }>(
    `SELECT ${DECADA_SQL} AS decada, SUM(mulher) AS mulheres, SUM(homem) AS homens
     FROM ${DEMOGRAFIA_ROWS} WHERE ${where.sql}
     GROUP BY 1 ORDER BY 1`,
    where.params,
  );

  return rows.map((row) => ({
    faixa: FAIXAS_DECENAIS[row.decada - 1],
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

/**
 * "População por município": os municípios do filtro, do mais populoso ao
 * menos. O mapa mostra a área toda; a lista fica só com os escolhidos.
 *
 * @example populacaoPorMunicipio(mapa, ["2504009"]) // [{ label: "Campina Grande (PB)", value: 419379 }]
 */
export const populacaoPorMunicipio = (
  mapa: ChoroplethRegion[],
  mun?: string[],
): ChartPoint[] =>
  mapa
    .filter((region) => !mun || mun.includes(region.code))
    .sort((a, b) => b.value - a.value)
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
  const [porAno, piramide, mapa] = await Promise.all([
    loadPorAno(query, filters),
    loadPiramide(query, filters),
    loadMapa(query, filters),
  ]);
  const index = porAno.findIndex((row) => Number(row.ano) === filters.ano);
  const atual = porAno[index];
  const anterior = index > 0 ? porAno[index - 1] : undefined;

  return {
    ...selection,
    serie: porAno.map((row) => ({
      label: String(row.ano),
      value: cell(row, "populacao_total"),
    })),
    sexo: { mulheres: cell(atual, "mulher"), homens: cell(atual, "homem") },
    corRaca: corRacaDe(atual),
    corRacaAnterior: anterior
      ? { ano: Number(anterior.ano), corRaca: corRacaDe(anterior) }
      : null,
    piramide,
    mapa,
  };
};
