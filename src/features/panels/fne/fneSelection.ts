import {
  FNE_SEMIARIDO,
  type FneFilters,
} from "@/features/panels/fne/fneFilters";
import { buildFneWhere, FNE_INDICADORES } from "@/features/panels/fne/fneSql";
import type {
  MunicipalityOption,
  UfOption,
} from "@/features/panels/territorialOptions";
import type { SqlQuery } from "@/features/panels/territorialSql";

export type FneSelection = {
  filters: FneFilters;
  ufs: UfOption[];
  municipios: MunicipalityOption[];
};

const loadUfs = async (
  query: SqlQuery,
  filters: FneFilters,
): Promise<UfOption[]> => {
  const where = buildFneWhere(filters, { byUf: false, byMunicipality: false });
  const rows = await query<{ sigla_uf: string; uf: string }>(
    `SELECT DISTINCT i.sigla_uf, i.uf FROM ${FNE_INDICADORES} i
     WHERE ${where.sql} ORDER BY i.uf`,
    where.params,
  );

  return rows.map((row) => ({ sigla: row.sigla_uf, nome: row.uf }));
};

const loadMunicipios = async (
  query: SqlQuery,
  filters: FneFilters,
): Promise<MunicipalityOption[]> => {
  const where = buildFneWhere(filters, { byUf: true, byMunicipality: false });
  const rows = await query<{
    cd_mun: number;
    nm_mun: string;
    sigla_uf: string;
  }>(
    `SELECT i.cd_mun, i.nm_mun, i.sigla_uf FROM ${FNE_INDICADORES} i
     WHERE ${where.sql} ORDER BY i.nm_mun, i.sigla_uf`,
    where.params,
  );

  return rows.map((row) => ({
    cdMun: String(row.cd_mun),
    nome: `${row.nm_mun} (${row.sigla_uf})`,
  }));
};

// UF e município só valem se existirem no recorte; senão caem fora do filtro.
export const resolveFneSelection = async (
  query: SqlQuery,
  requested: FneFilters,
): Promise<FneSelection> => {
  const { uf: requestedUf, ...rest } = requested;
  const base: FneFilters = { ...rest, muns: [] };
  const ufs = await loadUfs(query, base);
  const uf = ufs.find((item) => item.sigla === requestedUf)?.sigla;
  const scoped: FneFilters = uf ? { ...base, uf } : base;
  const municipios = await loadMunicipios(query, scoped);
  const available = new Set(municipios.map((item) => item.cdMun));
  const muns = requested.muns.filter((cdMun) => available.has(cdMun));

  return { filters: { ...scoped, muns }, ufs, municipios };
};

const describeRecorte = ({ semiarido, bioma }: FneFilters): string[] => [
  ...(semiarido
    ? [FNE_SEMIARIDO.find((option) => option.value === semiarido)!.label]
    : []),
  ...(bioma ? [bioma] : []),
];

const describeMunicipios = (
  muns: string[],
  municipios: MunicipalityOption[],
): string | undefined => {
  if (muns.length > 1) return `${muns.length} municípios`;

  return municipios.find((item) => item.cdMun === muns[0])?.nome;
};

/**
 * One-line summary of the active filters, for the mobile filter sheet.
 * @example describeFneSelection(selection) // "Pernambuco · Semiárido · 2025"
 */
export const describeFneSelection = ({
  filters,
  ufs,
  municipios,
}: FneSelection): string => {
  const uf = ufs.find((item) => item.sigla === filters.uf);
  const place =
    describeMunicipios(filters.muns, municipios) ??
    uf?.nome ??
    "Todos os municípios";

  return [place, ...describeRecorte(filters), String(filters.ano)].join(" · ");
};
