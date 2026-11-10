/**
 * Places a report can be generated for, as served by `/api/reports/cities`.
 * States and municipalities travel apart so the search can always show every
 * state while capping only the municipalities.
 * Example: `{ states: ["Bahia", …], cities: ["Recife (PE)", …] }`.
 */
export type ReportPlaces = {
  states: string[];
  cities: string[];
};

export const EMPTY_REPORT_PLACES: ReportPlaces = { states: [], cities: [] };

/**
 * Every place name, states first. Example: `listReportPlaceNames(places)`.
 */
export function listReportPlaceNames(places: ReportPlaces): string[] {
  return [...places.states, ...places.cities];
}

/**
 * Reads a `/api/reports/cities` payload; a missing or malformed list becomes
 * empty instead of breaking the search.
 * Example: `parseReportPlaces(await response.json())`.
 */
export function parseReportPlaces(payload: unknown): ReportPlaces {
  if (typeof payload !== "object" || payload === null) {
    return EMPTY_REPORT_PLACES;
  }
  const { states, cities } = payload as Partial<
    Record<keyof ReportPlaces, unknown>
  >;

  return { states: toNameList(states), cities: toNameList(cities) };
}

function toNameList(names: unknown): string[] {
  return Array.isArray(names) ? names.map(String) : [];
}
