import type {
  TerritorialArea,
  TerritorialFilters,
} from "@/features/panels/territorialFilters";

export type SqlQuery = <Row>(sql: string, params: unknown[]) => Promise<Row[]>;
export type NumericCell = string | number | null;
export type SqlWhere = { sql: string; params: unknown[] };
export type WhereScope = { byYear: boolean; byMunicipality: boolean };

export const toNumber = (value: NumericCell): number => Number(value ?? 0);

// DO NOT CHANGE: vira nome de coluna no SQL; nunca use o valor vindo da URL.
const AREA_COLUMN: Record<TerritorialArea, string> = {
  nordeste: "nordeste",
  semiarido: "semiarido",
  caatinga: "caatinga",
  sudene: "sudene",
};

export const buildTerritorialWhere = (
  filters: TerritorialFilters,
  scope: WhereScope,
): SqlWhere => {
  const conditions = [`${AREA_COLUMN[filters.area]} = 'Sim'`];
  const params: unknown[] = [];
  const add = (column: string, value: unknown) => {
    params.push(value);
    conditions.push(`${column} = $${params.length}`);
  };

  // Um valor mantém o `= $n` de sempre (o Perfil Demográfico gera o mesmo SQL);
  // vários viram `= ANY($n)` com um array, que o pg envia como parâmetro.
  const addAny = (column: string, values: string[] = []) => {
    if (values.length === 1) add(column, values[0]);
    if (values.length < 2) return;
    params.push(values);
    conditions.push(`${column} = ANY($${params.length})`);
  };

  if (scope.byYear) add("ano", filters.ano);
  addAny("sigla_uf", filters.uf);
  if (scope.byMunicipality) addAny("cd_mun", filters.mun);

  return { sql: conditions.join(" AND "), params };
};
