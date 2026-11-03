import type { FneFilters } from "@/features/panels/fne/fneFilters";
import type { SqlWhere } from "@/features/panels/territorialSql";

export const FNE_INDICADORES = "instrsudene_fne.fne_indicadores";
export const FNE_PROGRAMAS = "instrsudene_fne.fne_programas";

// fne_programas não tem os recortes territoriais: vêm do município no mesmo ano.
export const PROGRAMAS_JOIN = `${FNE_PROGRAMAS} p
  JOIN ${FNE_INDICADORES} i ON i.cd_mun = p.cd_mun AND i.fne_ano = p.ano`;

export type FneWhereScope = { byUf: boolean; byMunicipality: boolean };

const SEMIARIDO_VALUE = { sim: "Sim", nao: "Não" } as const;

/**
 * WHERE over fne_indicadores (alias `i`), with every value as a parameter.
 * @example buildFneWhere({ ano: 2025, visao: "valor", uf: "PE", muns: [] }, { byUf: true, byMunicipality: false })
 */
export const buildFneWhere = (
  filters: FneFilters,
  scope: FneWhereScope,
): SqlWhere => {
  const params: unknown[] = [];
  const bind = (value: unknown) => `$${params.push(value)}`;
  const conditions = [`i.fne_ano = ${bind(filters.ano)}`];

  if (filters.semiarido) {
    conditions.push(`i.semi_21 = ${bind(SEMIARIDO_VALUE[filters.semiarido])}`);
  }
  if (filters.bioma) conditions.push(`i.bioma = ${bind(filters.bioma)}`);
  if (scope.byUf && filters.uf) {
    conditions.push(`i.sigla_uf = ${bind(filters.uf)}`);
  }
  if (scope.byMunicipality && filters.muns.length) {
    conditions.push(`i.cd_mun = ANY(${bind(filters.muns.map(Number))})`);
  }

  return { sql: conditions.join(" AND "), params };
};
