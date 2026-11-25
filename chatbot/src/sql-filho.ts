/**
 * Processo filho que executa as consultas do consultar_sql.
 *
 * Fica num processo separado porque o node:sqlite não consegue interromper uma
 * consulta em andamento: quando passa do prazo, o servidor mata este processo
 * e sobe outro.
 */
import { DatabaseSync } from "node:sqlite";

const caminho = process.argv[2];
const db = new DatabaseSync(caminho, { readOnly: true });
db.exec("PRAGMA query_only = ON; PRAGMA cache_size = -64000;");

process.on("message", (msg: { id: number; sql: string; limite: number }) => {
  try {
    const stmt = db.prepare(msg.sql);
    const linhas: unknown[] = [];
    let truncado = false;
    for (const linha of stmt.iterate()) {
      if (linhas.length >= msg.limite) {
        truncado = true;
        break;
      }
      linhas.push(linha);
    }
    const colunas = stmt.columns().map((c) => c.name);
    process.send!({ id: msg.id, ok: true, colunas, linhas, truncado });
  } catch (error) {
    process.send!({ id: msg.id, ok: false, erro: (error as Error).message });
  }
});
