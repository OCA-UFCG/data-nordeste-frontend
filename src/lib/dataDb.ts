import { Pool } from "pg";
import type { SqlQuery } from "@/features/panels/territorialSql";

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

export const queryDataDb: SqlQuery = async (sql, params) => {
  const result = await getPool(process.env.DATA_DB_URL).query(sql, params);

  return result.rows;
};
