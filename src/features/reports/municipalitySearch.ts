import { normalizeSearchText } from "@/features/search/search";
import {
  listReportPlaceNames,
  type ReportPlaces,
} from "@/features/reports/reportPlaces";

export const MAX_MUNICIPALITY_SUGGESTIONS = 8;

export function resolveMunicipality(
  query: string,
  places: ReportPlaces,
): string | null {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return null;

  return (
    listReportPlaceNames(places).find(
      (place) => normalizeSearchText(place) === normalizedQuery,
    ) ?? null
  );
}

/**
 * Suggestions for the report search, states first. An empty query shows every
 * state plus the first municipalities; a typed query shows every prefix match.
 * Example: `filterMunicipalitySuggestions("rec", places)` → `["Recife (PE)"]`.
 */
export function filterMunicipalitySuggestions(
  query: string,
  places: ReportPlaces,
): string[] {
  const normalizedQuery = normalizeSearchText(query);

  // IMPORTANT: only municipalities are capped. Capping the merged list let the
  // nine states fill all eight slots, hiding Bahia (last in the backend's
  // `/estados`) and every municipality (review on PR feat/relatorio-por-estado).
  if (!normalizedQuery) {
    return [
      ...places.states,
      ...places.cities.slice(0, MAX_MUNICIPALITY_SUGGESTIONS),
    ];
  }

  return listReportPlaceNames(places).filter((place) =>
    normalizeSearchText(place).startsWith(normalizedQuery),
  );
}
