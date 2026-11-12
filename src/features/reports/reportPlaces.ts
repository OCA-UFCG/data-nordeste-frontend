/**
 * Places a report can be generated for, as served by `/api/reports/cities`.
 * States, areas of interest and municipalities travel apart so the search can
 * always show every state and area while capping only the municipalities.
 * Example: `{ states: ["Bahia", …], areas: ["Caatinga", …], cities: ["Recife (PE)", …] }`.
 */
export type ReportPlaces = {
  states: string[];
  areas: string[];
  cities: string[];
};

export const EMPTY_REPORT_PLACES: ReportPlaces = {
  states: [],
  areas: [],
  cities: [],
};

/**
 * Every place name: states, then areas, then cities. Example: `listReportPlaceNames(places)`.
 */
export function listReportPlaceNames(places: ReportPlaces): string[] {
  return [...places.states, ...places.areas, ...places.cities];
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
  const { states, areas, cities } = payload as Partial<
    Record<keyof ReportPlaces, unknown>
  >;

  return {
    states: toNameList(states),
    areas: toNameList(areas),
    cities: toNameList(cities),
  };
}

function toNameList(names: unknown): string[] {
  return Array.isArray(names) ? names.map(String) : [];
}
