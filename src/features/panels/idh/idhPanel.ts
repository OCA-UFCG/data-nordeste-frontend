import type { ChoroplethRegion } from "@/features/panels/chartOptions";
import type { ChoroplethBucket } from "@/features/panels/choropleth";
import {
  firstValue,
  listYears,
  UF_PATTERN,
  type SearchParams,
  type YearRange,
} from "@/features/panels/territorialFilters";
import type { UfOption } from "@/features/panels/territorialOptions";
import {
  toNumber,
  type NumericCell,
  type SqlQuery,
  type SqlWhere,
} from "@/features/panels/territorialSql";

export const IDH_YEAR_RANGE: YearRange = { first: 2012, last: 2021 };

// Classes do PNUD com as cores e os nomes da legenda do Power BI.
export const IDH_MAP_BUCKETS: readonly ChoroplethBucket[] = [
  { max: 0.5, label: "Muito baixo", color: "#bf1621" },
  { max: 0.6, label: "Baixo", color: "#f5791a" },
  { max: 0.7, label: "Médio", color: "#ffbe20" },
  { max: 0.8, label: "Alto", color: "#00bd47" },
  { max: Infinity, label: "Muito alto", color: "#769fff" },
];

export const IDH_VISOES = [
  { key: "geral", label: "Visão geral" },
  { key: "sexo", label: "Visão por sexo" },
  { key: "cor", label: "Visão por cor" },
] as const;

export type IdhVisao = (typeof IDH_VISOES)[number]["key"];

export type IdhFilters = {
  ano: number;
  visao: IdhVisao;
  uf?: string;
};

export const DEFAULT_IDH_FILTERS: IdhFilters = {
  ano: IDH_YEAR_RANGE.last,
  visao: "geral",
};

const isVisao = (value?: string): value is IdhVisao =>
  IDH_VISOES.some((visao) => visao.key === value);

export const parseIdhFilters = (params: SearchParams): IdhFilters => {
  const ano = Number(firstValue(params.ano));
  const visao = firstValue(params.visao);
  const uf = firstValue(params.uf)?.toUpperCase();

  return {
    ano: listYears(IDH_YEAR_RANGE).includes(ano)
      ? ano
      : DEFAULT_IDH_FILTERS.ano,
    visao: isVisao(visao) ? visao : DEFAULT_IDH_FILTERS.visao,
    ...(uf && UF_PATTERN.test(uf) ? { uf } : {}),
  };
};

export const buildIdhSearch = (filters: IdhFilters): string => {
  const params = new URLSearchParams();

  if (filters.ano !== DEFAULT_IDH_FILTERS.ano) {
    params.set("ano", String(filters.ano));
  }
  if (filters.uf) params.set("uf", filters.uf);
  if (filters.visao !== DEFAULT_IDH_FILTERS.visao) {
    params.set("visao", filters.visao);
  }
  const search = params.toString();

  return search ? `?${search}` : "";
};

export type IdhYearPoint = {
  ano: number;
  idh: number;
  idhAjustado: number;
  gini: number;
  rendaPerCapita: number;
  rendimento: number;
};

export type IdhGroupPoint = {
  ano: number;
  idh: number;
  gini: number;
  rendaPerCapita: number;
  rendimento: number;
};

export type IdhGroupSerie = { label: string; serie: IdhGroupPoint[] };

export type IdhPanelData = {
  filters: IdhFilters;
  ufs: UfOption[];
  serie: IdhYearPoint[];
  mapa: ChoroplethRegion[];
  sexo: IdhGroupSerie[];
  cor: IdhGroupSerie[];
};

const GERAL_VIEW = "des_idh.idh_geral_novo_view";

// Nas views de sexo e cor a sigla está em estado_rm, não em sigla_uf (e a de
// sexo também troca agregacao com estado_1). regiao_metropolitana e o sufixo
// de estado_uf ("... - PE") são iguais nas três, por isso o filtro usa esses.
// `renda`: a renda per capita de cada visão no Power BI (rdpct por sexo, rdpc
// por cor).
const GROUPS = {
  sexo: {
    view: "des_idh.idh_sexo_novo_view",
    column: "sexo",
    renda: "rdpct",
    labels: { HOMEM: "Homem", MULHER: "Mulher" },
  },
  cor: {
    view: "des_idh.idh_cor_novo_view",
    column: "cor",
    renda: "rdpc",
    labels: { BRANCO: "Branco", NEGRO: "Negro" },
  },
} as const;

const buildIdhWhere = (
  filters: IdhFilters,
  scope: { byYear: boolean; byUf: boolean },
): SqlWhere => {
  const params: unknown[] = [];

  // As views também têm uma linha por região metropolitana; o Power BI só
  // mostra estados, então o painel nativo também (sem filtro de recorte).
  const conditions: string[] = ["regiao_metropolitana = 'Não'"];
  const add = (column: string, value: unknown) => {
    params.push(value);
    conditions.push(`${column} = $${params.length}`);
  };

  if (scope.byYear) add("ano", filters.ano);
  if (scope.byUf && filters.uf) add("RIGHT(TRIM(estado_uf), 2)", filters.uf);

  return { sql: conditions.join(" AND "), params };
};

const loadUfs = async (query: SqlQuery): Promise<UfOption[]> => {
  const rows = await query<{ sigla_uf: string; estado_1: string }>(
    `SELECT DISTINCT sigla_uf, estado_1 FROM ${GERAL_VIEW}
     WHERE regiao_metropolitana = 'Não' ORDER BY estado_1`,
    [],
  );

  return rows.map((row) => ({ sigla: row.sigla_uf, nome: row.estado_1 }));
};

// Sem UF, o valor é a média simples dos estados, como no Power BI.
const loadSerie = async (query: SqlQuery, filters: IdhFilters) => {
  const where = buildIdhWhere(filters, { byYear: false, byUf: true });
  const rows = await query<Record<string, NumericCell> & { ano: number }>(
    `SELECT ano, AVG(idh) AS idh, AVG(idh_ad) AS idh_ad, AVG(gini) AS gini,
       AVG(rdpct) AS rdpct, AVG(renocup) AS renocup
     FROM ${GERAL_VIEW} WHERE ${where.sql} GROUP BY ano ORDER BY ano`,
    where.params,
  );

  return rows.map((row) => ({
    ano: row.ano,
    idh: toNumber(row.idh),
    idhAjustado: toNumber(row.idh_ad),
    gini: toNumber(row.gini),
    rendaPerCapita: toNumber(row.rdpct),
    rendimento: toNumber(row.renocup),
  }));
};

const loadLugares = async (query: SqlQuery, filters: IdhFilters) => {
  const where = buildIdhWhere(filters, { byYear: true, byUf: false });
  const rows = await query<{ lugar: string; uf: string; idh: NumericCell }>(
    `SELECT estado_rm AS lugar, RIGHT(TRIM(estado_uf), 2) AS uf, idh
     FROM ${GERAL_VIEW} WHERE ${where.sql} ORDER BY idh DESC`,
    where.params,
  );

  return rows.map((row) => ({
    code: row.uf,
    name: row.lugar,
    uf: row.uf,
    value: toNumber(row.idh),
  }));
};

const loadGroups = async (
  query: SqlQuery,
  filters: IdhFilters,
  { view, column, renda, labels }: (typeof GROUPS)[keyof typeof GROUPS],
): Promise<IdhGroupSerie[]> => {
  const where = buildIdhWhere(filters, { byYear: false, byUf: true });
  const rows = await query<{
    ano: number;
    grupo: string;
    idh: NumericCell;
    gini: NumericCell;
    renda: NumericCell;
    renocup: NumericCell;
  }>(
    `SELECT ano, ${column} AS grupo, AVG(idh) AS idh, AVG(gini) AS gini,
       AVG(${renda}) AS renda, AVG(renocup) AS renocup
     FROM ${view} WHERE ${where.sql} GROUP BY ano, ${column} ORDER BY ano`,
    where.params,
  );

  return Object.entries(labels).map(([grupo, label]) => ({
    label,
    serie: rows
      .filter((row) => row.grupo === grupo)
      .map((row) => ({
        ano: row.ano,
        idh: toNumber(row.idh),
        gini: toNumber(row.gini),
        rendaPerCapita: toNumber(row.renda),
        rendimento: toNumber(row.renocup),
      })),
  }));
};

export const loadIdhPanel = async (
  query: SqlQuery,
  requested: IdhFilters,
): Promise<IdhPanelData> => {
  const ufs = await loadUfs(query);
  const uf = ufs.find((item) => item.sigla === requested.uf)?.sigla;
  const filters: IdhFilters = uf
    ? { ...requested, uf }
    : { ano: requested.ano, visao: requested.visao };
  const [serie, mapa, sexo, cor] = await Promise.all([
    loadSerie(query, filters),
    loadLugares(query, filters),
    loadGroups(query, filters, GROUPS.sexo),
    loadGroups(query, filters, GROUPS.cor),
  ]);

  return { filters, ufs, serie, mapa, sexo, cor };
};

export const describeIdhSelection = ({
  filters,
  ufs,
}: Pick<IdhPanelData, "filters" | "ufs">): string => {
  const uf = ufs.find((item) => item.sigla === filters.uf);
  const place = uf ? uf.nome : "Média dos estados do Nordeste";

  return `${place} · ${filters.ano}`;
};
