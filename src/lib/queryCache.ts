import type { SqlQuery } from "@/features/panels/territorialSql";

type CacheEntry = { rows: Promise<unknown[]>; expiresAt: number };

export type QueryCacheOptions = {
  query: SqlQuery;
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
};

const cacheKey = (sql: string, params: unknown[]): string =>
  JSON.stringify([sql, params]);

// Map guarda a ordem de inserção: o primeiro é o usado há mais tempo.
const touch = (
  entries: Map<string, CacheEntry>,
  key: string,
  entry: CacheEntry,
) => {
  entries.delete(key);
  entries.set(key, entry);
};

const evictOldest = (entries: Map<string, CacheEntry>, maxEntries: number) => {
  while (entries.size > maxEntries) {
    entries.delete(entries.keys().next().value as string);
  }
};

/**
 * Wraps a SQL runner with an in-memory cache keyed by SQL and parameters.
 * Concurrent identical queries share one round trip; failures are not kept.
 * IMPORTANT: every caller gets the same rows array — map or copy, never mutate.
 * @example const cached = createQueryCache({ query, ttlMs: 86_400_000, maxEntries: 500 });
 */
export const createQueryCache = ({
  query,
  ttlMs,
  maxEntries,
  now = Date.now,
}: QueryCacheOptions): SqlQuery => {
  const entries = new Map<string, CacheEntry>();

  return async <Row>(sql: string, params: unknown[]) => {
    const key = cacheKey(sql, params);
    const cached = entries.get(key);

    if (cached && cached.expiresAt > now()) {
      touch(entries, key, cached);

      return cached.rows as Promise<Row[]>;
    }
    const rows = query<Row>(sql, params);

    touch(entries, key, { rows, expiresAt: now() + ttlMs });
    evictOldest(entries, maxEntries);
    rows.catch(() => entries.delete(key));

    return rows;
  };
};
