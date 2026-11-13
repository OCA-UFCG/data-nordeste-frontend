import { getAutomaticReportSlug } from "@/features/reports/automaticReport";
import {
  EMPTY_REPORT_PLACES,
  type ReportPlaces,
} from "@/features/reports/reportPlaces";

export type ReportScopeId =
  | "municipio"
  | "estado"
  | "nordeste"
  | "caatinga"
  | "semiarido"
  | "area-sudene";

export type ReportScopeGroupId = "geopolitico" | "estrategico";

/**
 * One "Recorte" the report can be scoped to. A search scope lists territories
 * to pick from; an area scope is itself the territory (the whole Caatinga, the
 * whole Nordeste), so it carries the area name the backend expects.
 * Example: `{ id: "caatinga", label: "Caatinga", group: "estrategico", areaName: "Caatinga" }`.
 */
export type ReportScope = {
  id: ReportScopeId;
  label: string;
  group: ReportScopeGroupId;
} & ({ searchPlaceholder: string } | { areaName: string });

export type ReportScopeGroup = {
  id: ReportScopeGroupId;
  label: string;
  scopes: ReportScope[];
};

const REPORT_SCOPE_GROUP_LABELS: Record<ReportScopeGroupId, string> = {
  geopolitico: "Recortes geopolíticos",
  estrategico: "Recortes estratégicos",
};

// IMPORTANT: `areaName` must match Automatic-Reporting `/areas` exactly: it is
// the name sent to `/relatorio/{name}`. In the Figma, choosing "Nordeste" opens
// a state search, but that duplicates "Estado" and leaves the whole-Nordeste
// report unreachable; product decided (12/11/2026) that every area scope,
// Nordeste included, is the whole area, with no search.
export const REPORT_SCOPES: ReportScope[] = [
  {
    id: "municipio",
    label: "Município",
    group: "geopolitico",
    searchPlaceholder: "Pesquise ou selecione um município",
  },
  {
    id: "estado",
    label: "Estado",
    group: "geopolitico",
    searchPlaceholder: "Pesquise ou selecione um estado",
  },
  {
    id: "nordeste",
    label: "Nordeste",
    group: "geopolitico",
    areaName: "Nordeste",
  },
  {
    id: "caatinga",
    label: "Caatinga",
    group: "estrategico",
    areaName: "Caatinga",
  },
  {
    id: "semiarido",
    label: "Semiárido",
    group: "estrategico",
    areaName: "Semiárido",
  },
  {
    id: "area-sudene",
    label: "Área de atuação da Sudene",
    group: "estrategico",
    areaName: "Área de atuação da Sudene",
  },
];

/**
 * The area name of an area scope, or null for a search scope.
 * Example: `getScopeAreaName(findReportScope("caatinga"))` → `"Caatinga"`.
 */
export function getScopeAreaName(scope: ReportScope | null): string | null {
  return scope && "areaName" in scope ? scope.areaName : null;
}

/**
 * Scopes grouped for the "Recorte" menu, in display order. An area scope only
 * shows when the backend lists that area (`places.areas`): beta and prod run an
 * Automatic-Reporting without `/areas`, and offering a report that would fail
 * is worse than hiding it. Empty groups are left out.
 * Example: `groupReportScopes(["Caatinga"])[1].scopes[0].label` → `"Caatinga"`.
 */
export function groupReportScopes(
  availableAreas: string[],
): ReportScopeGroup[] {
  const groupIds: ReportScopeGroupId[] = ["geopolitico", "estrategico"];
  const offered = REPORT_SCOPES.filter((scope) => {
    const areaName = getScopeAreaName(scope);

    return areaName === null || availableAreas.includes(areaName);
  });

  return groupIds
    .map((groupId) => ({
      id: groupId,
      label: REPORT_SCOPE_GROUP_LABELS[groupId],
      scopes: offered.filter((scope) => scope.group === groupId),
    }))
    .filter((group) => group.scopes.length > 0);
}

/**
 * The scope with this id, or null. Example: `findReportScope("estado")?.label` → `"Estado"`.
 */
export function findReportScope(
  scopeId: ReportScopeId | null,
): ReportScope | null {
  return REPORT_SCOPES.find((scope) => scope.id === scopeId) ?? null;
}

/**
 * Narrows the places to the chosen scope, so the territory search only lists
 * states for "Estado" and municipalities for "Município"; an area scope keeps
 * only its own area. No scope means no places.
 * Example: `selectReportScopePlaces("estado", places)` → `{ states, areas: [], cities: [] }`.
 */
export function selectReportScopePlaces(
  scopeId: ReportScopeId | null,
  places: ReportPlaces,
): ReportPlaces {
  if (scopeId === "estado") {
    return { ...EMPTY_REPORT_PLACES, states: places.states };
  }
  if (scopeId === "municipio") {
    return { ...EMPTY_REPORT_PLACES, cities: places.cities };
  }
  const areaName = getScopeAreaName(findReportScope(scopeId));
  if (areaName && places.areas.includes(areaName)) {
    return { ...EMPTY_REPORT_PLACES, areas: [areaName] };
  }

  return EMPTY_REPORT_PLACES;
}

// INTENTIONAL: Automatic-Reporting has no area matview for these themes
// (auto_relatorios_areaint, 12/11/2026). Asked for an area, it skips them, or
// answers 503 when they are the only themes, so the form does not offer them.
// The form shows them disabled, not hidden, so the user sees the theme exists
// but not for this "Recorte".
const THEME_IDS_WITHOUT_AREA_DATA = new Set([
  "desenvolvimento_social",
  "instrumentos_sudene",
]);

// INTENTIONAL: the state report (auto_relatorios_est) has no matview for
// Instrumentos Sudene. Desenvolvimento Social left this list on 13/11/2026,
// once `est_desen_social` and DESENVOLVIMENTO_SOCIAL_ESTADO_DOCS_URL existed.
const THEME_IDS_WITHOUT_STATE_DATA = new Set(["instrumentos_sudene"]);

/**
 * Whether the report can include this Data Nordeste theme in the chosen scope:
 * a theme without a report slug never can, and the state and area scopes each
 * leave out the themes their backend report has no data for. Only "Município"
 * (or no scope yet) offers every theme with a report.
 * Example: `isThemeAvailableInScope("instrumentos_sudene", "estado")` → `false`.
 */
export function isThemeAvailableInScope(
  themeId: string,
  scopeId: ReportScopeId | null,
): boolean {
  if (!getAutomaticReportSlug(themeId)) return false;
  if (scopeId === null || scopeId === "municipio") return true;
  if (scopeId === "estado") return !THEME_IDS_WITHOUT_STATE_DATA.has(themeId);

  return !THEME_IDS_WITHOUT_AREA_DATA.has(themeId);
}
