import path from "node:path";

export type GeodataFile = { absolutePath: string; contentType: string };

// Só o que scripts/geodata escreve: JSON, GeoJSON e o PNG da aridez.
const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".json": "application/json",
  ".geojson": "application/geo+json",
  ".png": "image/png",
};

// O build escreve o relatório de problemas na mesma pasta (vira o PDF da
// equipe de dados); não é dado do mapa e não sai pela rota.
const PRIVATE_FILE_NAMES = new Set(["data-issues.json"]);

function isPrivateFile(absolutePath: string): boolean {
  return PRIVATE_FILE_NAMES.has(path.basename(absolutePath).toLowerCase());
}

function isSafeSegment(segment: string): boolean {
  if (segment === "" || segment === "." || segment === "..") return false;

  return !/[/\\\0]/.test(segment);
}

function isInside(root: string, candidate: string): boolean {
  return candidate.startsWith(root.endsWith(path.sep) ? root : root + path.sep);
}

/**
 * Maps URL segments to a file under `root`, or `null` when the path could leave
 * the directory, points at a type the map does not need or names a private
 * file (`data-issues.json`).
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
  if (isPrivateFile(absolutePath)) return null;

  const contentType =
    CONTENT_TYPE_BY_EXTENSION[path.extname(absolutePath).toLowerCase()];

  return contentType ? { absolutePath, contentType } : null;
}

/** Validator that changes whenever the file is regenerated. Example: `"10-1700000000000"`. */
export function geodataEtag(size: number, mtimeMs: number): string {
  return `"${size}-${Math.trunc(mtimeMs)}"`;
}

function acceptsGzip(acceptEncoding: string | null): boolean {
  if (!acceptEncoding) return false;

  return acceptEncoding.split(",").some((entry) => {
    const [coding, ...params] = entry.trim().toLowerCase().split(";");
    const quality = params.find((param) => param.trim().startsWith("q="));

    return (
      coding.trim() === "gzip" && Number(quality?.trim().slice(2) ?? 1) > 0
    );
  });
}

/**
 * Decides whether the response body goes out gzipped: only text formats
 * (JSON/GeoJSON) and only when the client advertises gzip. PNG is already
 * compressed, so gzip would just burn CPU.
 * Example: `shouldGzip("application/geo+json", "gzip, br")` is `true`.
 */
export function shouldGzip(
  contentType: string,
  acceptEncoding: string | null,
): boolean {
  if (!contentType.includes("json")) return false;

  return acceptsGzip(acceptEncoding);
}

/** In-process cache key for a gzipped file. Example: `"/g/a.json|\"10-1700000000000\""`. */
export function gzipCacheKey(absolutePath: string, etag: string): string {
  return `${absolutePath}|${etag}`;
}
