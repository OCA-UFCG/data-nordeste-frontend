/**
 * Execução das consultas do consultar_sql em processos filhos (sql-filho.ts).
 *
 * O node:sqlite não interrompe uma consulta em andamento: cada consulta roda
 * num filho, e o que passa do prazo é morto sem levar as outras junto. As que
 * chegam com todos ocupados esperam a vez. Copiado do chat do SEDES.
 *
 * Variável: DATANE_SQL_SIMULTANEAS (padrão 2).
 */
import { fork, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TABELAO, type Linhas } from "./banco.ts";

const FILHO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../sql-filho.ts");
export const LIMITE_LINHAS = 200;
export const PRAZO_SQL_MS = 10_000;
const SIMULTANEAS = Number(process.env.DATANE_SQL_SIMULTANEAS ?? 2);

export type RespostaSql = { ok: true; colunas: string[]; linhas: Linhas; truncado: boolean } | { ok: false; erro: string };

const livres: ChildProcess[] = [];
const vivos = new Set<ChildProcess>();
const fila: Array<() => void> = [];
let ocupados = 0;
let proximoId = 1;

function novoFilho() {
  // O node 24 lê TypeScript sem o tsx; poupa memória em cada filho.
  const filho = fork(FILHO, [TABELAO], { execArgv: ["--no-warnings"], stdio: ["ignore", "ignore", "inherit", "ipc"] });
  vivos.add(filho);
  filho.on("exit", () => {
    vivos.delete(filho);
    const i = livres.indexOf(filho);
    if (i >= 0) livres.splice(i, 1);
  });

  return filho;
}

async function vaga() {
  if (ocupados >= SIMULTANEAS) await new Promise<void>((r) => fila.push(r));
  ocupados += 1;
}

function liberarVaga() {
  ocupados -= 1;
  fila.shift()?.();
}

export async function executarSql(sql: string, limite = LIMITE_LINHAS): Promise<RespostaSql> {
  await vaga();
  const filho = livres.pop() ?? novoFilho();
  const id = proximoId++;
  try {
    return await new Promise<RespostaSql>((resolve) => {
      const prazo = setTimeout(() => {
        filho.off("message", ouvir);
        filho.kill("SIGKILL");
        resolve({
          ok: false,
          erro: `A consulta passou de ${PRAZO_SQL_MS / 1000} s e foi cancelada. Filtre por indicador e periodo (o começo da chave da tabela valores) e evite varrer todos os meses do Monitor de Secas.`,
        });
      }, PRAZO_SQL_MS);
      function ouvir(msg: RespostaSql & { id: number }) {
        if (msg.id !== id) return;
        clearTimeout(prazo);
        filho.off("message", ouvir);
        if (filho.connected) livres.push(filho);
        resolve(msg);
      }
      filho.on("message", ouvir);
      filho.send({ id, sql, limite });
    });
  } finally {
    liberarVaga();
  }
}

/** Encerra os processos de SQL (o servidor faz isso sozinho ao sair). */
export function encerrarFerramentas() {
  for (const f of vivos) f.kill("SIGKILL");
}
process.on("exit", encerrarFerramentas);

/** Só uma consulta SELECT/WITH por vez; o banco já abre só para leitura. */
export function validarSql(sql: string): string | null {
  const limpo = sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .trim()
    .replace(/;\s*$/, "");
  if (!/^(select|with)\b/i.test(limpo)) return "Só são aceitas consultas que começam com SELECT ou WITH.";
  if (limpo.includes(";")) return "Mande uma consulta por vez, sem ';' no meio.";
  if (/\b(attach|detach|pragma|vacuum)\b/i.test(limpo.replace(/'[^']*'/g, "''")))
    return "A consulta contém um comando que não é permitido aqui.";

  return null;
}
