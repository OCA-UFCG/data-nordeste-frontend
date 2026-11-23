import { readFile, stat } from "node:fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import {
  geodataEtag,
  resolveGeodataFile,
  type GeodataFile,
} from "@/features/geodata/geodataFile";

const CACHE_CONTROL = "public, max-age=86400";

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
  const headers = { "Cache-Control": CACHE_CONTROL, "ETag": etag };
  if (request.headers.get("If-None-Match") === etag) {
    return new NextResponse(null, { status: 304, headers });
  }

  const body = await readFile(file.absolutePath);

  return new NextResponse(new Uint8Array(body), {
    headers: { ...headers, "Content-Type": file.contentType },
  });
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
