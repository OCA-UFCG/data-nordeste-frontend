import type { FneFilters } from "@/features/panels/fne/fneFilters";
import {
  FNE_PORTE_ORDER,
  FNE_SETORES,
  labelPorte,
  NO_RIDE,
  SEMIARIDO_LABELS,
} from "@/features/panels/fne/fneLabels";
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

export type FneMetrics = { quantidade: number; valor: number };
export type FneBreakdown = FneMetrics & { label: string };

export type FneTotals = FneMetrics & {
  ticketMedio: number;
  municipiosAtendidos: number;
};

type MetricRow = {
  label: string | null;
  quantidade: NumericCell;
  valor: NumericCell;
};

const FULL_SCOPE = { byUf: true, byMunicipality: true };

const toBreakdown = (row: MetricRow, label: string): FneBreakdown => ({
  label,
  quantidade: toNumber(row.quantidade),
  valor: toNumber(row.valor),
});

const SETOR_SUMS = FNE_SETORES.map(
  ({ prefix }) =>
    `SUM(i.${prefix}_qtd) AS ${prefix}_qtd, SUM(i.${prefix}_valor) AS ${prefix}_valor`,
).join(", ");

const toTotals = (row: Record<string, NumericCell>): FneTotals => {
  const quantidade = toNumber(row.quantidade);
  const valor = toNumber(row.valor);

  return {
    quantidade,
    valor,
    ticketMedio: quantidade ? valor / quantidade : 0,
    municipiosAtendidos: toNumber(row.atendidos),
  };
};

export const loadFneSummary = async (query: SqlQuery, filters: FneFilters) => {
  const where = buildFneWhere(filters, FULL_SCOPE);
  const [row = {}] = await query<Record<string, NumericCell>>(
    `SELECT SUM(i.fne_qtd_total) AS quantidade, SUM(i.fne_valor_total) AS valor,
       COUNT(*) FILTER (WHERE i.fne_qtd_total > 0) AS atendidos, ${SETOR_SUMS}
     FROM ${FNE_INDICADORES} i WHERE ${where.sql}`,
    where.params,
  );
  const setores = FNE_SETORES.map(({ prefix, label }) => ({
    label,
    quantidade: toNumber(row[`${prefix}_qtd`]),
    valor: toNumber(row[`${prefix}_valor`]),
  }));

  return { totais: toTotals(row), setores };
};

// DO NOT CHANGE: `column` entra no SQL; nunca venha da URL.
export const FNE_DIMENSIONS = {
  tipologias: {
    column: "i.tipo_pndr_3",
    labels: {},
    fallback: "Sem tipologia",
  },
  portesPopulacionais: {
    column: "i.porte_populacional",
    labels: {},
    fallback: "Sem porte",
  },
  estados: { column: "i.uf", labels: {}, fallback: "Sem estado" },
  semiarido: { column: "i.semi_21", labels: SEMIARIDO_LABELS, fallback: "—" },
  rides: { column: "i.ride", labels: {}, fallback: NO_RIDE },
} as const satisfies Record<
  string,
  { column: string; labels: Record<string, string>; fallback: string }
>;

export type FneDimension = keyof typeof FNE_DIMENSIONS;

const loadDimension = async (
  query: SqlQuery,
  filters: FneFilters,
  dimension: FneDimension,
): Promise<FneBreakdown[]> => {
  const { column, labels, fallback } = FNE_DIMENSIONS[dimension];
  const where = buildFneWhere(filters, FULL_SCOPE);
  const rows = await query<MetricRow>(
    `SELECT NULLIF(TRIM(${column}), '') AS label,
       SUM(i.fne_qtd_total) AS quantidade, SUM(i.fne_valor_total) AS valor
     FROM ${FNE_INDICADORES} i WHERE ${where.sql} GROUP BY 1`,
    where.params,
  );
  const named: Record<string, string> = labels;

  return rows.map((row) =>
    toBreakdown(row, row.label ? named[row.label] ?? row.label : fallback),
  );
};

export const loadFneDimensions = async (
  query: SqlQuery,
  filters: FneFilters,
): Promise<Record<FneDimension, FneBreakdown[]>> => {
  const keys = Object.keys(FNE_DIMENSIONS) as FneDimension[];
  const results = await Promise.all(
    keys.map((key) => loadDimension(query, filters, key)),
  );

  return Object.fromEntries(
    keys.map((key, index) => [key, results[index]]),
  ) as Record<FneDimension, FneBreakdown[]>;
};

const porteRank = (label: string | null) => {
  const rank = FNE_PORTE_ORDER.indexOf(label ?? "");

  return rank === -1 ? FNE_PORTE_ORDER.length : rank;
};

// A base grava o porte com espaços à direita ("MEDIO I      ").
export const loadFnePortes = async (
  query: SqlQuery,
  filters: FneFilters,
): Promise<FneBreakdown[]> => {
  const where = buildFneWhere(filters, FULL_SCOPE);
  const rows = await query<MetricRow>(
    `SELECT TRIM(p.porte) AS label,
       SUM(p.quantidade) AS quantidade, SUM(p.valor_rs) AS valor
     FROM ${PROGRAMAS_JOIN} WHERE ${where.sql} GROUP BY 1`,
    where.params,
  );

  return [...rows]
    .sort((a, b) => porteRank(a.label) - porteRank(b.label))
    .map((row) => toBreakdown(row, labelPorte(row.label ?? "")));
};
