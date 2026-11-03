import type { ChartPoint } from "@/features/panels/chartOptions";
import {
  loadFneDimensions,
  loadFnePortes,
  loadFneSummary,
  type FneBreakdown,
  type FneDimension,
  type FneTotals,
} from "@/features/panels/fne/fneBreakdowns";
import type { FneFilters, FneVisao } from "@/features/panels/fne/fneFilters";
import { labelSetor } from "@/features/panels/fne/fneLabels";
import {
  resolveFneSelection,
  type FneSelection,
} from "@/features/panels/fne/fneSelection";
import {
  buildFneWhere,
  FNE_INDICADORES,
  PROGRAMAS_JOIN,
} from "@/features/panels/fne/fneSql";
import {
  toNumber,
  type NumericCell,
  type SqlQuery,
} from "@/features/panels/territorialSql";

export type FneMapRegion = {
  code: string;
  name: string;
  uf: string;
  quantidade: number;
  valor: number;
  ticketMedio: number;
};

export type FneHighlight = {
  cdMun: string;
  nome: string;
  uf: string;
  total: number;
  setor: string;
  finalidade: string;
  programa: string;
  destaque: number;
};

export type FnePanelData = FneSelection &
  Record<FneDimension, FneBreakdown[]> & {
    totais: FneTotals;
    setores: FneBreakdown[];
    portes: FneBreakdown[];
    mapa: FneMapRegion[];
    destaques: Record<FneVisao, FneHighlight[]>;
  };

const loadMapa = async (
  query: SqlQuery,
  filters: FneFilters,
): Promise<FneMapRegion[]> => {
  const where = buildFneWhere(filters, { byUf: true, byMunicipality: false });
  const rows = await query<{
    cd_mun: number;
    nm_mun: string;
    sigla_uf: string;
    quantidade: NumericCell;
    valor: NumericCell;
    ticket: NumericCell;
  }>(
    `SELECT i.cd_mun, i.nm_mun, i.sigla_uf, i.fne_qtd_total AS quantidade,
       i.fne_valor_total AS valor, i.fne_tm_total AS ticket
     FROM ${FNE_INDICADORES} i WHERE ${where.sql}`,
    where.params,
  );

  return rows.map((row) => ({
    code: String(row.cd_mun),
    name: row.nm_mun,
    uf: row.sigla_uf,
    quantidade: toNumber(row.quantidade),
    valor: toNumber(row.valor),
    ticketMedio: toNumber(row.ticket),
  }));
};

// DO NOT CHANGE: vira nome de coluna no SQL.
const HIGHLIGHT_COLUMN: Record<FneVisao, string> = {
  quantidade: "p.quantidade",
  valor: "p.valor_rs",
};

type HighlightRow = {
  cd_mun: number;
  nm_mun: string;
  sigla_uf: string;
  setor: string;
  finalidade: string;
  programa: string;
  destaque: NumericCell;
  total: NumericCell;
};

// Como a lista do ArcGIS: total do município e a combinação setor + finalidade
// + programa que mais pesa nele, nos 20 maiores do recorte.
const loadHighlights = async (
  query: SqlQuery,
  filters: FneFilters,
  visao: FneVisao,
): Promise<FneHighlight[]> => {
  const where = buildFneWhere(filters, { byUf: true, byMunicipality: true });
  const rows = await query<HighlightRow>(
    `WITH combinacoes AS (
       SELECT p.cd_mun, i.nm_mun, i.sigla_uf, TRIM(p.setor) AS setor,
         TRIM(p.finalidade) AS finalidade,
         TRIM(p.programa) AS programa, SUM(${HIGHLIGHT_COLUMN[visao]}) AS destaque
       FROM ${PROGRAMAS_JOIN} WHERE ${where.sql} GROUP BY 1, 2, 3, 4, 5, 6
     ), ranqueadas AS (
       SELECT *, SUM(destaque) OVER (PARTITION BY cd_mun) AS total,
         ROW_NUMBER() OVER (PARTITION BY cd_mun ORDER BY destaque DESC) AS posicao
       FROM combinacoes
     )
     SELECT * FROM ranqueadas WHERE posicao = 1 ORDER BY total DESC LIMIT 20`,
    where.params,
  );

  return rows.map(toHighlight);
};

const toHighlight = (row: HighlightRow): FneHighlight => ({
  cdMun: String(row.cd_mun),
  nome: row.nm_mun,
  uf: row.sigla_uf,
  total: toNumber(row.total),
  setor: labelSetor(row.setor),
  finalidade: row.finalidade,
  programa: row.programa,
  destaque: toNumber(row.destaque),
});

const loadDestaques = async (query: SqlQuery, filters: FneFilters) => {
  const [quantidade, valor] = await Promise.all([
    loadHighlights(query, filters, "quantidade"),
    loadHighlights(query, filters, "valor"),
  ]);

  return { quantidade, valor };
};

/**
 * Loads every block of the FNE panel for the filters, both metrics at once so
 * switching the Quantidade/Valor tab does not query the database again.
 * @example await loadFnePanel(queryDataDb, parseFneFilters(searchParams))
 */
export const loadFnePanel = async (
  query: SqlQuery,
  requested: FneFilters,
): Promise<FnePanelData> => {
  const selection = await resolveFneSelection(query, requested);
  const { filters } = selection;
  const [summary, dimensions, portes, mapa, destaques] = await Promise.all([
    loadFneSummary(query, filters),
    loadFneDimensions(query, filters),
    loadFnePortes(query, filters),
    loadMapa(query, filters),
    loadDestaques(query, filters),
  ]);

  return { ...selection, ...summary, ...dimensions, portes, mapa, destaques };
};

/**
 * Picks one metric of a breakdown for a chart; `sorted` orders by that metric.
 * @example toFneChartPoints(data.estados, "valor", { sorted: true })
 */
export const toFneChartPoints = (
  breakdowns: FneBreakdown[],
  visao: FneVisao,
  { sorted }: { sorted: boolean },
): ChartPoint[] => {
  const points = breakdowns.map((item) => ({
    label: item.label,
    value: item[visao],
  }));

  return sorted ? points.sort((a, b) => b.value - a.value) : points;
};
