import type { TerritorialFilters } from "@/features/panels/territorialFilters";
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

// A view precisa ter sigla_uf, estado_uf, cd_mun, municipio_uf, ano e as colunas de área.
export const resolveTerritorialSelection = async (
  query: SqlQuery,
  view: string,
  requested: TerritorialFilters,
): Promise<TerritorialSelection> => {
  const base = { ano: requested.ano, area: requested.area };
  const ufs = await loadUfs(query, view, base);
  const uf = ufs.find((item) => item.sigla === requested.uf)?.sigla;
  const scoped: TerritorialFilters = uf ? { ...base, uf } : base;
  const municipios = await loadMunicipios(query, view, scoped);
  const mun = municipios.find((item) => item.cdMun === requested.mun)?.cdMun;

  return { filters: mun ? { ...scoped, mun } : scoped, ufs, municipios };
};

export const describeTerritorialSelection = ({
  filters,
  ufs,
  municipios,
}: TerritorialSelection): string => {
  const municipio = municipios.find((item) => item.cdMun === filters.mun);
  const uf = ufs.find((item) => item.sigla === filters.uf);
  const place = municipio?.nome ?? uf?.nome ?? "Todos os municípios da área";

  return `${place} · ${filters.ano}`;
};
