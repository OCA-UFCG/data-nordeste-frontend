import { GERAL_VIEW } from "@/features/panels/idh/idhPanel";
import type { YearRange } from "@/features/panels/territorialFilters";
import {
  toNumber,
  type NumericCell,
  type SqlQuery,
} from "@/features/panels/territorialSql";

// Sem o intervalo (a consulta falhou) não há ano a oferecer: `available` vazio
// esconde os anos e `last` só ocupa o lugar do ano padrão, que ninguém vê.
export const NO_IDH_YEARS: YearRange = { first: 0, last: 0, available: [] };

/**
 * Primeiro e último ano que o banco tem de IDH.
 *
 * @example await loadIdhYearRange(queryDataDb) // { first: 2012, last: 2021 }
 */
export const loadIdhYearRange = async (query: SqlQuery): Promise<YearRange> => {
  const [row] = await query<{ primeiro: NumericCell; ultimo: NumericCell }>(
    `SELECT MIN(ano) AS primeiro, MAX(ano) AS ultimo FROM ${GERAL_VIEW}`,
    [],
  );

  // NaN, não 0: tabela vazia devolve null e `toNumber(null)` viraria o ano 0.
  const first = toNumber(row?.primeiro ?? Number.NaN);
  const last = toNumber(row?.ultimo ?? Number.NaN);

  if (!Number.isInteger(first) || !Number.isInteger(last) || first > last) {
    throw new Error(
      `IDH year range is ${JSON.stringify(row)}; expected integer min(ano) <= max(ano) from ${GERAL_VIEW}.`,
    );
  }

  return { first, last };
};

/**
 * Como `loadIdhYearRange`, mas a falha vira log JSON e `null`, para a página
 * mostrar o erro dos cards em vez de cair.
 *
 * @example (await tryLoadIdhYearRange(queryDataDb)) ?? NO_IDH_YEARS
 */
export const tryLoadIdhYearRange = async (
  query: SqlQuery,
): Promise<YearRange | null> => {
  try {
    return await loadIdhYearRange(query);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "idh_demo_year_range_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};
