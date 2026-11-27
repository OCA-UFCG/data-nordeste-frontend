/**
 * Mantém o tabelão no cache de disco do sistema, lendo o arquivo inteiro de
 * tempos em tempos e jogando os bytes fora.
 *
 * Por quê: no gamma, à noite e depois de horas sem uso, uma pergunta levou 72 s
 * e teve 3 consultas canceladas pelo prazo de 10 s (conversa ae695d68,
 * 25/11/2026). Medido na VM em 27/11/2026, a mesma consulta (populacao 2022
 * com JOIN em territorios) levou 61 s com o arquivo fora do cache e 46 ms com
 * ele no cache: o SQLite escolhe o índice por território e faz milhares de
 * leituras espalhadas, e o disco da VM lê ~31 MB/s. Com o arquivo no cache,
 * qualquer plano é rápido. Reler um arquivo que já está no cache custa ~1 s de
 * CPU; se o sistema o tirou do cache, a releitura o traz de volta.
 *
 * Variável: DATANE_AQUECER_MIN (padrão 30; 0 desliga).
 *
 *   manterNoCache("/app/dados/datane.sqlite", 30); // lê agora e a cada 30 min
 */
import { createReadStream } from "node:fs";

/** Lê o arquivo inteiro e devolve quantos bytes leu. */
export function lerInteiro(arquivo: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let bytes = 0;
    createReadStream(arquivo, { highWaterMark: 4 * 1024 * 1024 })
      .on("data", (pedaco) => (bytes += pedaco.length))
      .on("end", () => resolve(bytes))
      .on("error", reject);
  });
}

async function aquecer(arquivo: string) {
  const inicio = Date.now();
  try {
    const bytes = await lerInteiro(arquivo);
    console.log(JSON.stringify({ event: "tabelao_lido_para_o_cache", bytes, ms: Date.now() - inicio }));
  } catch (e) {
    console.error(JSON.stringify({ event: "falha_ao_ler_tabelao_para_o_cache", arquivo, mensagem: (e as Error).message }));
  }
}

/** Lê o arquivo agora e a cada `minutos` (0 desliga). Não segura o processo vivo. */
export function manterNoCache(arquivo: string, minutos: number) {
  if (!(minutos > 0)) return;
  void aquecer(arquivo);
  setInterval(() => void aquecer(arquivo), minutos * 60_000).unref();
}
