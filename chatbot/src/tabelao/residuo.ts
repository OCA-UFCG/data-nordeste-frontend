/**
 * Tira dos valores o resíduo da conta em ponto flutuante (100,00000000000001
 * em vez de 100), arredondando para 9 casas, bem além das que o assistente
 * mostra. Na seca da Paraíba (agosto de 2026), 4 municípios tinham o resíduo e
 * 56 o 100 exato: `valor = 100` achava 56 de 60 e o resumo contava só os 4
 * (gamma, 25/11/2026).
 *
 * montar-tabelao.ts chama tirarResiduo para cada indicador. Para corrigir um
 * tabelão já montado sem regerar (dá o mesmo resultado):
 *   npx tsx src/tabelao/residuo.ts [dados/datane.sqlite]
 */
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CASAS = 9;

/** Arredonda os valores de um indicador (ou de todos); devolve quantos mudaram. */
export function tirarResiduo(db: DatabaseSync, indicador?: string): number {
  const filtro = indicador ? "AND indicador = ?" : "";
  const r = db
    .prepare(`UPDATE valores SET valor = ROUND(valor, ${CASAS}) WHERE valor <> ROUND(valor, ${CASAS}) ${filtro}`)
    .run(...(indicador ? [indicador] : []));

  return Number(r.changes);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arquivo = process.argv[2] ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../dados/datane.sqlite");
  const db = new DatabaseSync(arquivo);
  console.log(`${tirarResiduo(db)} valores arredondados para ${CASAS} casas em ${arquivo}.`);
  db.close();
}
