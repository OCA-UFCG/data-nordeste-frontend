import { readFile, stat } from "node:fs/promises";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { NextResponse, type NextRequest } from "next/server";
import {
  geodataEtag,
  gzipCacheKey,
  resolveGeodataFile,
  shouldGzip,
  type GeodataFile,
} from "@/features/geodata/geodataFile";

const CACHE_CONTROL = "public, max-age=86400";
const gzipAsync = promisify(gzip);

// PERF: `next start` does not compress route handler responses (pib.geojson is
// ~4.5 MB raw, ~1.3 MB gzipped). The files only change when the directory is
// regenerated, so each one is compressed once per process; the etag in the key
// retires the entry when that happens.
const gzipCache = new Map<string, Buffer>();

type GeodataContext = { params: Promise<{ path: string[] }> };

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function logMissing(segments: string[], reason: string) {
  console.error(
    JSON.stringify({ event: "geodata_file_missing", path: segments, reason }),
  );
}

async function statFile(absolutePath: string) {
  try {
    const info = await stat(absolutePath);

    return info.isFile() ? info : null;
  } catch {
    return null;
  }
}

async function gzippedBody(absolutePath: string, etag: string) {
  const key = gzipCacheKey(absolutePath, etag);
  const cached = gzipCache.get(key);
  if (cached) return cached;

  const compressed = await gzipAsync(await readFile(absolutePath));
  gzipCache.set(key, compressed);

  return compressed;
}

const BASE_HEADERS = {
  "Cache-Control": CACHE_CONTROL,
  "Vary": "Accept-Encoding",
};

async function fileResponse(
  request: NextRequest,
  file: GeodataFile,
  etag: string,
) {
  const compress = shouldGzip(
    file.contentType,
    request.headers.get("Accept-Encoding"),
  );
  const body = compress
    ? await gzippedBody(file.absolutePath, etag)
    : await readFile(file.absolutePath);

  return new NextResponse(new Uint8Array(body), {
    headers: {
      ...BASE_HEADERS,
      "ETag": etag,
      "Content-Type": file.contentType,
      ...(compress && { "Content-Encoding": "gzip" }),
    },
  });
}

async function serveFile(
  request: NextRequest,
  file: GeodataFile,
  segments: string[],
) {
  const info = await statFile(file.absolutePath);
  if (!info) {
    logMissing(segments, "not_found");

    return jsonError(`Geodata file "${segments.join("/")}" not found.`, 404);
  }

  const etag = geodataEtag(info.size, info.mtimeMs);
  if (request.headers.get("If-None-Match") === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: { ...BASE_HEADERS, ETag: etag },
    });
  }

  return fileResponse(request, file, etag);
}

/**
 * Serves the map geodata prepared by `scripts/geodata` from `GEODATA_DIR`.
 * Example: `GET /api/geodata/vector/pib.geojson`.
 */
export async function GET(request: NextRequest, { params }: GeodataContext) {
  const root = process.env.GEODATA_DIR;
  if (!root) {
    return jsonError(
      `GEODATA_DIR is "${root}"; expected the directory prepared by scripts/geodata.`,
      503,
    );
  }

  const { path: segments } = await params;
  const file = resolveGeodataFile(root, segments);
  if (!file) {
    return jsonError(
      `Geodata path "${segments.join("/")}" is invalid; expected a .json, .geojson or .png file inside the geodata directory.`,
      400,
    );
  }

  return serveFile(request, file, segments);
}
