/**
 * Transforma as conversas gravadas pela página de chat em perguntas
 * candidatas para o perguntas.md. Lê conversas/*.jsonl (ou outra pasta, ex.:
 * a cópia das conversas do beta), marca as respostas que merecem atenção e
 * grava conversas/candidatas.md, fora do git porque traz perguntas de pessoas
 * reais.
 *
 * Cada candidata já sai no formato do perguntas.md (Pergunta, Depois), com a
 * resposta que o bot deu e o motivo de ter sido marcada. Falta escrever a
 * resposta esperada, conferida no tabelão, antes de passá-la para o
 * perguntas.md. Para ver como o bot de hoje responde às candidatas:
 *
 *   npm run candidatas                      # ou: -- --pasta /outro/lugar
 *   npm run avaliar -- --arquivo conversas/candidatas.md --sem-juiz
 *
 * Ordem: 👎 primeiro, depois as que têm algum sinal (erro, recusa, lentidão,
 * muitas ferramentas), depois o resto. Pula perguntas que já estão no
 * perguntas.md ou repetidas.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { lerPerguntas, PACOTE } from "./avaliacao.ts";

export type Registro =
  | { tipo: "inicio"; id: string; modelo?: string; em?: string }
  | {
      tipo: "turno";
      turno: number;
      pergunta: string;
      resposta: string;
      ferramentas?: Array<{ nome?: string; saida?: string }>;
      ms?: number;
      interrompida?: boolean;
      erro?: string | null;
      em?: string;
    }
  | {
      tipo: "avaliacao";
      turno: number;
      nota: "bom" | "ruim" | null;
      comentario?: string;
    }
  | { tipo: "fim" };

type Turno = Extract<Registro, { tipo: "turno" }>;

export type Candidata = {
  id: string;
  perguntas: string[];
  resposta: string;
  ferramentas: string[];
  ms?: number;
  nota: "bom" | "ruim" | null;
  comentario?: string;
  sinais: string[];
  /** 0 = 👎, 1 = algum sinal, 2 = nenhum sinal */
  prioridade: number;
};

const LENTA_MS = 30_000;
const MUITAS_FERRAMENTAS = 6;

// Frases de quando o bot diz que não consegue. Nem toda recusa é erro (o
// assistente pode mesmo não ter o dado), mas vale olhar.
const RECUSA =
  /n[ãa]o (tenho|possuo) (uma |a |essa )?(ferramenta|acesso)|n[ãa]o consigo|n[ãa]o (é|foi) poss[íi]vel|n[ãa]o h[áa] como/i;

export const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Uma linha do perguntas.md: sem quebras nem espaços repetidos. */
const umaLinha = (t: string) => t.replace(/\s+/g, " ").trim();

function sinaisDo(t: Turno): string[] {
  const s: string[] = [];
  if (t.erro) s.push(`erro: ${umaLinha(t.erro).slice(0, 120)}`);
  if (t.interrompida) s.push("interrompida");
  const comErro = (t.ferramentas ?? []).filter((f) =>
    /^Erro/.test(f.saida ?? ""),
  );
  if (comErro.length)
    s.push(
      `ferramenta com erro (${comErro.map((f) => f.nome ?? "?").join(", ")})`,
    );
  const recusa = t.resposta.match(RECUSA);
  if (recusa) s.push(`recusa ("${recusa[0]}")`);
  if ((t.ms ?? 0) > LENTA_MS) s.push(`lenta (${Math.round(t.ms! / 1000)} s)`);
  if ((t.ferramentas?.length ?? 0) > MUITAS_FERRAMENTAS)
    s.push(`${t.ferramentas!.length} ferramentas`);
  return s;
}

/**
 * Uma candidata por pergunta feita, com as anteriores da mesma conversa como
 * "Depois:" (a pergunta pode depender delas).
 */
export function candidatasDe(
  conversas: Array<{ id: string; registros: Registro[] }>,
  jaExistentes: string[] = [],
): Candidata[] {
  const vistas = new Set(jaExistentes.map(normalizar));
  const saida: Candidata[] = [];
  for (const { id, registros } of conversas) {
    const turnos = registros
      .filter((r): r is Turno => r.tipo === "turno")
      .sort((a, b) => a.turno - b.turno);
    const notas = new Map<number, Extract<Registro, { tipo: "avaliacao" }>>();
    for (const r of registros)
      if (r.tipo === "avaliacao") notas.set(r.turno, r);
    turnos.forEach((t, i) => {
      const chave = normalizar(t.pergunta);
      if (chave.length < 4 || vistas.has(chave)) return;
      vistas.add(chave);
      const av = notas.get(t.turno);
      const sinais = sinaisDo(t);
      const nota = av?.nota ?? null;
      saida.push({
        id: `cand-${id}-${t.turno}`,
        perguntas: turnos.slice(0, i + 1).map((x) => umaLinha(x.pergunta)),
        resposta: t.resposta,
        ferramentas: (t.ferramentas ?? []).map((f) => f.nome ?? "?"),
        ms: t.ms,
        nota,
        comentario: av?.comentario || undefined,
        sinais,
        prioridade: nota === "ruim" ? 0 : sinais.length ? 1 : 2,
      });
    });
  }
  return saida.sort((a, b) => a.prioridade - b.prioridade);
}

export function emMarkdown(cs: Candidata[]): string {
  const rotulo = ["👎", "com sinal", "sem sinal"];
  const blocos = cs.map((c) => {
    const motivo = [
      c.nota === "ruim" ? "👎" : c.nota === "bom" ? "👍" : null,
      ...c.sinais,
    ].filter(Boolean);
    const citada = c.resposta
      .slice(0, 1500)
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    return [
      `### ${c.id} — candidata (${rotulo[c.prioridade]})`,
      "",
      `**Pergunta:** ${c.perguntas[0]}`,
      ...c.perguntas.slice(1).flatMap((p) => ["", `**Depois:** ${p}`]),
      "",
      "**Resposta esperada:** (a escrever, conferida no tabelão)",
      "",
      `Motivo: ${motivo.length ? motivo.join("; ") : "nenhum sinal"}.` +
        (c.comentario ? ` Comentário: "${umaLinha(c.comentario)}".` : ""),
      `Ferramentas: ${c.ferramentas.join(", ") || "nenhuma"}` +
        (c.ms ? ` · ${Math.round(c.ms / 1000)} s` : "") +
        ".",
      "",
      "Resposta que o bot deu:",
      "",
      citada + (c.resposta.length > 1500 ? "\n> […]" : ""),
    ].join("\n");
  });
  const n = (p: number) => cs.filter((c) => c.prioridade === p).length;
  return [
    "# Perguntas candidatas, das conversas gravadas",
    "",
    `${cs.length} perguntas novas: ${n(0)} com 👎, ${n(1)} com algum sinal, ${n(2)} sem sinal. Gerado por \`npm run candidatas\`; não vai para o git.`,
    "",
    ...blocos.flatMap((b) => [b, ""]),
  ].join("\n");
}

function lerConversas(pasta: string) {
  return readdirSync(pasta)
    .filter((f) => f.endsWith(".jsonl"))
    .sort()
    .map((f) => {
      const registros = readFileSync(path.join(pasta, f), "utf8")
        .split("\n")
        .filter(Boolean)
        .flatMap((l): Registro[] => {
          try {
            return [JSON.parse(l) as Registro];
          } catch {
            return [];
          }
        });
      const inicio = registros.find((r) => r.tipo === "inicio");
      const id =
        (inicio && "id" in inicio && inicio.id) || f.replace(/\.jsonl$/, "");
      return { id, registros };
    });
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      pasta: { type: "string", default: path.join(PACOTE, "conversas") },
      saida: {
        type: "string",
        default: path.join(PACOTE, "conversas/candidatas.md"),
      },
    },
  });
  const existentes = lerPerguntas().flatMap((p) => p.perguntas);
  const cs = candidatasDe(lerConversas(values.pasta), existentes);
  writeFileSync(values.saida, emMarkdown(cs));
  console.log(
    `${cs.length} candidatas (${cs.filter((c) => c.prioridade === 0).length} com 👎, ${cs.filter((c) => c.prioridade === 1).length} com sinal) em ${values.saida}`,
  );
}
