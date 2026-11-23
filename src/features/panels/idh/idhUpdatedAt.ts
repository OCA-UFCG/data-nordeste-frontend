const YEAR_MONTH = /^(\d{4})-(\d{2})/;

/**
 * Mês e ano ("MM/AAAA") de uma data ISO do Contentful, ou `undefined` sem data.
 *
 * @example formatIdhUpdatedAt("2026-10-22T00:00:00.000Z") // "10/2026"
 */
export const formatIdhUpdatedAt = (date?: string): string | undefined => {
  const match = YEAR_MONTH.exec(date ?? "");

  return match ? `${match[2]}/${match[1]}` : undefined;
};
