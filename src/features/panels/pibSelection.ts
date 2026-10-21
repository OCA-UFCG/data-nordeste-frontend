import {
  DEFAULT_PIB_SELECTION,
  type PibPanelSelection,
} from "@/features/panels/pibPanel";

// IMPORTANT: these values reach the Automatic-Reporting query string from a
// public URL. The backend whitelists the area again; checking the shape here
// keeps arbitrary text out of the upstream request.
const AREA_PATTERN = /^[a-z0-9_]{1,16}$/;
const UF_PATTERN = /^[A-Z]{2}$/;
const MUNICIPALITY_PATTERN = /^\d{6,7}$/;

/**
 * Reads and validates a selection from query params; throws on a malformed value.
 * Example: `parsePibSelection(new URLSearchParams("area=ne&uf=PB"))`.
 */
export function parsePibSelection(params: URLSearchParams): PibPanelSelection {
  const area = params.get("area") || DEFAULT_PIB_SELECTION.area;
  const uf = params.get("uf") || null;
  const municipio = params.get("municipio") || null;

  assertMatches("area", area, AREA_PATTERN, "lowercase id like aas_21");
  assertMatches("uf", uf, UF_PATTERN, "two uppercase letters like PB");
  assertMatches(
    "municipio",
    municipio,
    MUNICIPALITY_PATTERN,
    "IBGE code like 2504009",
  );

  return { area, uf, municipio: municipio ? Number(municipio) : null };
}

function assertMatches(
  name: string,
  value: string | null,
  pattern: RegExp,
  expected: string,
): void {
  if (value === null || pattern.test(value)) return;

  throw new Error(
    `Invalid PIB panel ${name} "${value}"; expected ${expected}.`,
  );
}

/** Serializes a selection, leaving empty filters out. Example: `toPibSelectionQuery({ area: "ne", uf: null, municipio: null }) === "area=ne"`. */
export function toPibSelectionQuery(selection: PibPanelSelection): string {
  const params = new URLSearchParams({ area: selection.area });

  if (selection.uf) params.set("uf", selection.uf);
  if (selection.municipio) params.set("municipio", String(selection.municipio));

  return params.toString();
}
