/**
 * Pergunta a um modelo e devolve a saída estruturada pelo esquema JSON. Usado
 * pelos juízes (avaliar.ts: acerto; clareza.ts: linguagem).
 *
 * Com ANTHROPIC_API_KEY (no .env), vai pela API e gasta a chave: uns
 * US$ 0,01 por resposta julgada no Sonnet. Sem a chave, ou com
 * DATANE_JUIZ_MOTOR=claude, vai pelo `claude -p` e gasta a assinatura de quem
 * roda. O gasto da API aparece em gastoDosJuizes().
 *
 *   const j = await perguntarAoClaude<{ nota: string }>({ modelo: "claude-sonnet-5-5",
 *     sistema: "Você confere…", esquema: ESQUEMA, texto: "## Pergunta…", rotulo: "M01" });
 */
import Anthropic from "@anthropic-ai/sdk";
import { execFile } from "node:child_process";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { PRECOS } from "./chat/precos.ts";

type Pedido = { modelo: string; sistema: string; esquema: string; texto: string; rotulo: string };

const PELA_API = process.env.DATANE_JUIZ_MOTOR !== "claude" && Boolean(process.env.ANTHROPIC_API_KEY);
let cliente: Anthropic | undefined;
let gastoUsd = 0;

export const motorDoJuiz = PELA_API ? "api" : "claude";

/** Quanto os juízes gastaram da chave neste processo (0 pelo claude -p). */
export function gastoDosJuizes(): number {
  return gastoUsd;
}

export function perguntarAoClaude<T>(p: Pedido): Promise<T | undefined> {
  return PELA_API ? pelaApi<T>(p) : peloClaude<T>(p);
}

// Saída estruturada da API (output_config.format): o texto da resposta é um
// JSON que segue o esquema do juiz. (O Sonnet 5.5 não aceita tool_choice
// forçado, o outro jeito de obter JSON.)
async function pelaApi<T>(p: Pedido): Promise<T | undefined> {
  cliente ??= new Anthropic({ maxRetries: 4 });
  try {
    const r = await cliente.messages.create({
      model: p.modelo,
      max_tokens: 8_000,
      // O critério se repete em todas as chamadas da rodada: fica no cache.
      system: [{ type: "text", text: p.sistema, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: JSON.parse(p.esquema) } },
      messages: [{ role: "user", content: p.texto }],
    });
    somarGasto(p.modelo, r.usage);
    const bloco = r.content.find((b) => b.type === "text");
    if (!bloco) throw new Error(`sem veredito (stop_reason ${r.stop_reason}); esperado um texto JSON`);

    return JSON.parse(bloco.text) as T;
  } catch (e) {
    console.error(`[juiz] ${p.rotulo}: ${(e as Error).message}`);

    return undefined;
  }
}

function somarGasto(modelo: string, u: Anthropic.Usage) {
  const preco = PRECOS[modelo];
  if (!preco) return;
  gastoUsd +=
    (u.input_tokens * preco.entrada +
      u.output_tokens * preco.saida +
      (u.cache_read_input_tokens ?? 0) * preco.leitura +
      (u.cache_creation_input_tokens ?? 0) * preco.escrita) /
    1e6;
}

function peloClaude<T>(p: Pedido): Promise<T | undefined> {
  // Pasta vazia: o claude não acha CLAUDE.md nem configurações de projeto.
  const pasta = path.join(os.homedir(), ".cache/datane-chatbot-juiz");
  mkdirSync(pasta, { recursive: true });
  const argumentos = [
    "-p", "--model", p.modelo, "--tools", "", "--setting-sources", "",
    "--disable-slash-commands", "--no-session-persistence",
    "--system-prompt", p.sistema, "--output-format", "json", "--json-schema", p.esquema,
  ];

  return new Promise((ok) => {
    const proc = execFile("claude", argumentos, { cwd: pasta, maxBuffer: 10_000_000, timeout: 180_000 }, (erro, stdout) => {
      try {
        const j = JSON.parse(stdout) as { structured_output?: T };
        if (!j.structured_output) throw new Error("sem structured_output");
        ok(j.structured_output);
      } catch (e) {
        console.error(`[juiz] ${p.rotulo}: ${erro?.message ?? e}`);
        ok(undefined);
      }
    });
    proc.stdin!.end(p.texto);
  });
}
