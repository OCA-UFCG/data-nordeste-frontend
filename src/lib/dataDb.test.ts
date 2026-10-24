import { describe, expect, it, vi } from "vitest";
import { DATA_DB_CACHE_SECONDS } from "@/config/revalidation";

type CacheCall = { keyParts: string[]; options: object };

const cacheCalls = vi.hoisted((): CacheCall[] => []);

// Grava a configuração do cache em vez de depender do runtime do Next.
vi.mock("next/cache", () => ({
  unstable_cache: (
    fn: (...args: unknown[]) => unknown,
    keyParts: string[],
    options: object,
  ) => {
    cacheCalls.push({ keyParts, options });

    return fn;
  },
}));

describe("queryDataDb", () => {
  it("caches database reads for a day under a tag that can be revalidated", async () => {
    const { DATA_DB_CACHE_TAG } = await import("@/lib/dataDb");

    expect(cacheCalls).toEqual([
      {
        keyParts: ["data-db-query"],
        options: {
          revalidate: DATA_DB_CACHE_SECONDS,
          tags: [DATA_DB_CACHE_TAG],
        },
      },
    ]);
    expect(DATA_DB_CACHE_SECONDS).toBe(24 * 60 * 60);
  });

  it("explains a missing connection string with the expected shape", async () => {
    vi.stubEnv("DATA_DB_URL", "");
    const { queryDataDb } = await import("@/lib/dataDb");

    await expect(queryDataDb("SELECT 1", [])).rejects.toThrow(
      'DATA_DB_URL is ""; expected a postgres:// connection string',
    );
    vi.unstubAllEnvs();
  });
});
