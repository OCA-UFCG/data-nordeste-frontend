import {
  EMPTY_REPORT_PLACES,
  type ReportPlaces,
} from "@/features/reports/reportPlaces";

export type ReportScopeId = "municipio" | "estado";

export type ReportScopeGroupId = "geopolitico" | "estrategico";

/**
 * One "Recorte" the report can be scoped to.
 * Example: `{ id: "estado", label: "Estado", group: "geopolitico", … }`.
 */
export type ReportScope = {
  id: ReportScopeId;
  label: string;
  group: ReportScopeGroupId;
  searchPlaceholder: string;
};

export type ReportScopeGroup = {
  id: ReportScopeGroupId;
  label: string;
  scopes: ReportScope[];
};

const REPORT_SCOPE_GROUP_LABELS: Record<ReportScopeGroupId, string> = {
  geopolitico: "Recortes geopolíticos",
  estrategico: "Recortes estratégicos",
};

// IMPORTANT: the Figma also lists Nordeste and the strategic regions
// (Caatinga, Semiárido, Área de atuação da Sudene), but Automatic-Reporting
// only serves `/cities` and `/estados`. Product decided (Nov/2026) to hide
// them until the backend generates those reports, instead of showing them
// disabled. Add them here, with their ids, once the backend ships them.
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
];

/**
 * Scopes grouped for the "Recorte" menu, in display order. Groups with no
 * scope are left out, so "Recortes estratégicos" only shows once it has one.
 * Example: `groupReportScopes()[0].label` → `"Recortes geopolíticos"`.
 */
export function groupReportScopes(): ReportScopeGroup[] {
  const groupIds: ReportScopeGroupId[] = ["geopolitico", "estrategico"];

  return groupIds
    .map((groupId) => ({
      id: groupId,
      label: REPORT_SCOPE_GROUP_LABELS[groupId],
      scopes: REPORT_SCOPES.filter((scope) => scope.group === groupId),
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
 * states for "Estado" and municipalities for "Município". No scope means no
 * places.
 * Example: `selectReportScopePlaces("estado", places)` → `{ states, cities: [] }`.
 */
export function selectReportScopePlaces(
  scopeId: ReportScopeId | null,
  places: ReportPlaces,
): ReportPlaces {
  if (scopeId === "estado") return { states: places.states, cities: [] };
  if (scopeId === "municipio") return { states: [], cities: places.cities };

  return EMPTY_REPORT_PLACES;
}
