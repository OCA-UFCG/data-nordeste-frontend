import type { YearRange } from "@/features/panels/territorialFilters";
import {
  toNumber,
  type NumericCell,
  type SqlQuery,
} from "@/features/panels/territorialSql";

// Sem os anos (a consulta falhou) não há ano a oferecer: `available` vazio
// esconde os anos e `last` só ocupa o lugar do ano padrão, que ninguém vê.
export const NO_DEMOGRAFIA_YEARS: YearRange = {
  first: 0,
  last: 0,
  available: [],
};

/**
 * Os censos que o banco tem de demografia, do mais recente ao mais antigo.
 * Não são contíguos (2000, 2010, 2022), por isso vão em `available`.
 *
 * @example await loadDemografiaYearRange(queryDataDb) // { first: 2000, last: 2022, available: [2022, 2010, 2000] }
 */
export const loadDemografiaYearRange = async (
  query: SqlQuery,
): Promise<YearRange> => {
  const rows = await query<{ ano: NumericCell }>(
    "SELECT DISTINCT ano FROM dem_demografia.final_demografia ORDER BY ano DESC",
    [],
  );
  const available = rows.map((row) => toNumber(row.ano));

  if (!available.length || !available.every(Number.isInteger)) {
    throw new Error(
      `Demografia years are ${JSON.stringify(rows)}; expected at least one integer ano from dem_demografia.final_demografia.`,
    );
  }

  return {
    first: available[available.length - 1],
    last: available[0],
    available,
  };
};

/**
 * Como `loadDemografiaYearRange`, mas a falha vira log JSON e `null`, para a
 * página mostrar o erro dos cards em vez de cair.
 *
 * @example (await tryLoadDemografiaYearRange(queryDataDb)) ?? NO_DEMOGRAFIA_YEARS
 */
export const tryLoadDemografiaYearRange = async (
  query: SqlQuery,
): Promise<YearRange | null> => {
  try {
    return await loadDemografiaYearRange(query);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "demografia_demo_year_range_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};
