import { Pool } from "pg";
import { DATA_DB_CACHE_SECONDS } from "@/config/revalidation";
import type { SqlQuery } from "@/features/panels/territorialSql";
import { createQueryCache } from "@/lib/queryCache";

let pool: Pool | undefined;

const getPool = (connectionString: string | undefined): Pool => {
  if (!connectionString) {
    throw new Error(
      `DATA_DB_URL is "${connectionString}"; expected a postgres:// connection string to the Data Nordeste database.`,
    );
  }

  if (pool) return pool;

  pool = new Pool({
    connectionString,
    max: 4,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
    options: "-c default_transaction_read_only=on",
  });

  // Sem este listener, um cliente ocioso que cai derruba o processo do Next.
  pool.on("error", (error) => {
    console.error(
      JSON.stringify({
        event: "data_db_idle_client_error",
        message: error.message,
      }),
    );
  });

  return pool;
};

const runDataDbQuery: SqlQuery = async (sql, params) => {
  const result = await getPool(process.env.DATA_DB_URL).query(sql, params);

  return result.rows;
};

// PERF: cada visualização de painel roda ~14 consultas; sem cache, todas iam ao banco.
export const queryDataDb = createQueryCache({
  query: runDataDbQuery,
  ttlMs: DATA_DB_CACHE_SECONDS * 1000,
  maxEntries: 500,
});
