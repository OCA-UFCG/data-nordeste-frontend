import { normalizeSearchText } from "@/features/search/search";

export const MAX_MUNICIPALITY_SUGGESTIONS = 8;

export function resolveMunicipality(
  query: string,
  cities: string[],
): string | null {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return null;

  return (
    cities.find((city) => normalizeSearchText(city) === normalizedQuery) ?? null
  );
}

export function filterMunicipalitySuggestions(
  query: string,
  cities: string[],
): string[] {
  const normalizedQuery = normalizeSearchText(query);
  const matches = cities.filter(
    (city) =>
      !normalizedQuery || normalizeSearchText(city).startsWith(normalizedQuery),
  );

  return normalizedQuery
    ? matches
    : matches.slice(0, MAX_MUNICIPALITY_SUGGESTIONS);
}
