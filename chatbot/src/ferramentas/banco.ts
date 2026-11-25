/**
 * O tabelão aberto só para leitura, e o jeito de mostrar linhas ao modelo.
 *
 * Variável: DATANE_TABELAO (padrão dados/datane.sqlite).
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const PACOTE = path.resolve(AQUI, "../..");
export const TABELAO = process.env.DATANE_TABELAO ?? path.join(PACOTE, "dados/datane.sqlite");

if (!existsSync(TABELAO)) {
  throw new Error(`Tabelão não encontrado em "${TABELAO}"; esperado o SQLite gerado por "npm run tabelao" (veja o README).`);
}

export const db = new DatabaseSync(TABELAO, { readOnly: true });

export const GERADO_EM = (
  db.prepare("SELECT valor FROM metadados WHERE chave = 'gerado_em'").get() as { valor: string }
).valor;

export const dataBr = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");

// O rodapé dizia "Fonte: tabelão do Data Nordeste" e o modelo copiava o nome
// interno como fonte em ~1 de cada 10 respostas (rodadas v4 e c3-v1). Com a
// data da cópia, ele passou a escrevê-la como se fosse a data do dado (c6-v0,
// DF05): o rodapé não leva data nenhuma.
export const RODAPE = "\n(Dados do Data Nordeste. Na resposta, cite a fonte original do indicador, como IBGE ou DATASUS, e não esta linha.)";

export type Linhas = Array<Record<string, unknown>>;

/**
 * Um número como o modelo deve ler: ponto decimal, até 3 casas.
 * 3 casas: com 2, 44,947 virava 44,95 e o modelo arredondava de novo para 45,0 (visto no SEDES).
 * Mas "591.656" (área de Campina Grande, em km²) parece 591 mil em português, e
 * o Haiku escreveu "591,7 mil km²" (rodada c9-todas, DF01). Com 1 a 3 dígitos
 * antes do ponto e 3 depois, o número sai com 4 casas ("591.6560"), que não
 * tem leitura de milhar.
 */
export function numeroParaOModelo(v: number) {
  const texto = String(Math.round(v * 1000) / 1000);

  return /^-?[1-9]\d{0,2}\.\d{3}$/.test(texto) ? v.toFixed(4) : texto;
}

/** Linhas como "a | b", o formato que o modelo e a página leem. */
export function tabela(colunas: string[], linhas: Linhas) {
  const cel = (v: unknown) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return numeroParaOModelo(v);

    return String(v).replace(/\s+/g, " ").slice(0, 300);
  };

  return [colunas.join(" | "), ...linhas.map((l) => colunas.map((c) => cel(l[c])).join(" | "))].join("\n");
}

export const ehNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
