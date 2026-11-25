/**
 * As perguntas de teste (perguntas.md) e o que se confere em cada resposta.
 *
 * Formato de cada pergunta no perguntas.md:
 *
 *   ### M01 — categoria
 *   **Pergunta:** a primeira pergunta
 *   **Depois:** uma pergunta que continua a conversa (pode repetir a linha)
 *   **Resposta esperada:** o que o bot deve responder
 *   **Números:** 71,7 · 28,3   (opcional: têm de aparecer na última resposta)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PACOTE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export interface Pergunta {
  id: string;
  categoria: string;
  /** A primeira pergunta e as que continuam a conversa, na ordem. */
  perguntas: string[];
  esperada: string;
  numeros: string[];
}

/** Lê perguntas.md ou outro arquivo no mesmo formato (ex.: o de candidatas). */
export function lerPerguntas(
  arquivo = path.join(PACOTE, "perguntas.md"),
): Pergunta[] {
  return perguntasDoMarkdown(readFileSync(arquivo, "utf8"));
}

export function perguntasDoMarkdown(md: string): Pergunta[] {
  return md
    .split(/^### /m)
    .slice(1)
    .map((bloco) => ({
      id: bloco.split(/\s/)[0],
      categoria: bloco.match(/^\S+ — ([^\n]+)/)?.[1] ?? "",
      perguntas: [
        bloco.match(/\*\*Pergunta:\*\* ([^\n]+)/)?.[1] ?? "",
        ...[...bloco.matchAll(/\*\*Depois:\*\* ([^\n]+)/g)].map((m) => m[1]),
      ],
      esperada: bloco.match(/\*\*Resposta esperada:\*\* ([^\n]+)/)?.[1] ?? "",
      numeros: (bloco.match(/\*\*Números:\*\* ([^\n]+)/)?.[1] ?? "")
        .split("·")
        .map((n) => n.trim())
        .filter(Boolean),
    }));
}

/** Números esperados que não aparecem na resposta ("71,7" também casa "71,7%"). */
export function numerosFaltando(resposta: string, numeros: string[]) {
  const texto = resposta.replace(/ /g, " ");
  return numeros.filter((n) => {
    const literal = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return !new RegExp(`(?<![\\d,.])${literal}(?!\\d|,\\d)`).test(texto);
  });
}
