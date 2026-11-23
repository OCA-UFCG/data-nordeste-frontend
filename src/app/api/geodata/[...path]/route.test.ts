import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const GEOJSON = '{"type":"FeatureCollection","features":[]}';

function call(segments: string[], headers: Record<string, string> = {}) {
  const url = `http://localhost/api/geodata/${segments.join("/")}`;

  return GET(new NextRequest(url, { headers }), {
    params: Promise.resolve({ path: segments }),
  });
}

describe("GET /api/geodata/[...path]", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "geodata-route-"));
    await mkdir(path.join(root, "vector"));
    await writeFile(path.join(root, "vector", "pib.geojson"), GEOJSON);
    vi.stubEnv("GEODATA_DIR", root);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(root, { recursive: true, force: true });
  });

  it("serves the file with content type, cache and etag headers", async () => {
    const response = await call(["vector", "pib.geojson"]);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe(GEOJSON);
    expect(response.headers.get("Content-Type")).toBe("application/geo+json");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(response.headers.get("ETag")).toMatch(/^"\d+-\d+"$/);
  });

  it("answers 304 when If-None-Match matches the etag", async () => {
    const first = await call(["vector", "pib.geojson"]);
    const etag = first.headers.get("ETag") as string;

    const response = await call(["vector", "pib.geojson"], {
      "If-None-Match": etag,
    });

    expect(response.status).toBe(304);
    expect(response.headers.get("ETag")).toBe(etag);
    expect(await response.text()).toBe("");
  });

  it("answers 404 and logs when the file does not exist", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await call(["vector", "missing.geojson"]);

    expect(response.status).toBe(404);
    expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
      event: "geodata_file_missing",
    });
  });

  it("answers 404 for a directory with an allowed extension", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await mkdir(path.join(root, "dir.json"));

    expect((await call(["dir.json"])).status).toBe(404);
  });

  it("answers 400 for a path that escapes the directory", async () => {
    const response = await call(["..", "etc", "passwd"]);

    expect(response.status).toBe(400);
  });

  it("answers 400 for an extension outside the allow-list", async () => {
    expect((await call(["vector", "a.js"])).status).toBe(400);
  });

  it("answers 503 when GEODATA_DIR is not set", async () => {
    vi.stubEnv("GEODATA_DIR", undefined);

    const response = await call(["vector", "pib.geojson"]);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error:
        'GEODATA_DIR is "undefined"; expected the directory prepared by scripts/geodata.',
    });
  });
});
