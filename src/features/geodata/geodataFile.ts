import path from "node:path";

export type GeodataFile = { absolutePath: string; contentType: string };

// Só o que scripts/geodata escreve: JSON, GeoJSON e o PNG da aridez.
const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".json": "application/json",
  ".geojson": "application/geo+json",
  ".png": "image/png",
};

function isSafeSegment(segment: string): boolean {
  if (segment === "" || segment === "." || segment === "..") return false;

  return !/[/\\\0]/.test(segment);
}

function isInside(root: string, candidate: string): boolean {
  return candidate.startsWith(root.endsWith(path.sep) ? root : root + path.sep);
}

/**
 * Maps URL segments to a file under `root`, or `null` when the path could leave
 * the directory or points at a type the map does not need.
 * Example: `resolveGeodataFile("/g", ["vector", "pib.geojson"])`.
 */
export function resolveGeodataFile(
  root: string,
  segments: string[],
): GeodataFile | null {
  if (segments.length === 0 || !segments.every(isSafeSegment)) return null;

  const absoluteRoot = path.resolve(root);
  const absolutePath = path.resolve(absoluteRoot, ...segments);

  // WARNING: segment checks above already block traversal; this prefix check is
  // the last line of defence for the filesystem boundary. Do not drop it.
  if (!isInside(absoluteRoot, absolutePath)) return null;

  const contentType =
    CONTENT_TYPE_BY_EXTENSION[path.extname(absolutePath).toLowerCase()];

  return contentType ? { absolutePath, contentType } : null;
}

/** Validator that changes whenever the file is regenerated. Example: `"10-1700000000000"`. */
export function geodataEtag(size: number, mtimeMs: number): string {
  return `"${size}-${Math.trunc(mtimeMs)}"`;
}
