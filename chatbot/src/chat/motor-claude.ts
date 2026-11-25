/**
 * Motor "claude" da página de chat: abre um `claude -p` em stream-json por
 * conversa, com as mesmas opções do conversar.sh (lidas do comum.sh, para não
 * haver duas versões), e retoma com --resume. A conversa segue na assinatura
 * de quem roda a página; serve para testar no próprio computador, sem chave.
 *
 * Cada processo (claude + servidor MCP) ocupa uns 380 MB e fica aberto por 20
 * minutos depois da última pergunta. Para várias pessoas, use o motor "api".
 */
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Motor, Pedido, Turno } from "./turno.ts";
import { paraOModelo } from "./lingua.ts";
import { acabar } from "./acabamento.ts";

const PACOTE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const OCIOSA_MS = 20 * 60_000;

type Opcoes = {
  sessao: string;
  modelos: Record<string, string>;
  args: string[];
};

function lerOpcoes(): Opcoes {
  const saida = execFileSync(
    "bash",
    [
      "-c",
      'source "$1" >&2; printf "%s\\0" "$SESSAO" "$(modelo_id sonnet)" "$(modelo_id haiku)" "${OPCOES_CLAUDE[@]}"',
      "_",
      path.join(PACOTE, "comum.sh"),
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const [sessao, sonnet, haiku, ...args] = saida.split("\0").slice(0, -1);
  return { sessao, modelos: { sonnet, haiku }, args };
}

/** Linha do stream-json do claude: só os campos que este motor usa. */
type Bloco = {
  type: string;
  id?: string;
  name?: string;
  input?: unknown;
  tool_use_id?: string;
  content?: string | Array<{ text?: string }>;
  is_error?: boolean;
};
type MensagemClaude = {
  type: string;
  session_id?: string;
  event?: {
    type: string;
    content_block?: { type: string; name?: string };
    delta?: { type: string; text?: string };
  };
  message?: { content?: string | Bloco[] };
  duration_ms?: number;
  num_turns?: number;
  total_cost_usd?: number;
  usage?: unknown;
  is_error?: boolean;
  result?: string;
};

type Processo = {
  modelo: string;
  sessionId?: string;
  proc?: ChildProcess;
  turno?: Turno;
  pedido?: Pedido;
  /** Uso da resposta que a conferência mandou reescrever (soma com a nova). */
  usoAnterior?: Record<string, number>;
  ociosa?: NodeJS.Timeout;
};

/** Soma os contadores de duas respostas do claude no mesmo turno. */
function somarUso(a: Record<string, number> | undefined, b: unknown) {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries((b ?? {}) as Record<string, unknown>))
    if (typeof v === "number") out[k] = (out[k] ?? 0) + v;
  return out;
}

/**
 * argsExtras: opções a mais para o claude (a avaliação usa --no-session-persistence).
 * reserva: deixa um processo aberto à espera da próxima conversa nova.
 */
export function criarMotorClaude({
  argsExtras = [],
  reserva = true,
}: { argsExtras?: string[]; reserva?: boolean } = {}): Motor {
  let opcoes = lerOpcoes();
  let opcoesDoDia = new Date().toDateString();
  function opcoesAtuais() {
    // O prompt leva a data de hoje; relê se o servidor atravessou a meia-noite.
    if (new Date().toDateString() !== opcoesDoDia) {
      opcoes = lerOpcoes();
      opcoesDoDia = new Date().toDateString();
    }
    return opcoes;
  }

  const processos = new Map<string, Processo>();
  // Processos encerrados por nós (botão Parar ou conversa ociosa): a saída deles
  // não é erro. O claude sai com código 143, então o sinal não serve para saber.
  const encerrados = new WeakSet<ChildProcess>();

  function encerrarProcesso(p: Processo) {
    clearTimeout(p.ociosa);
    if (p.proc) encerrados.add(p.proc);
    p.proc?.kill("SIGTERM");
    p.proc = undefined;
  }

  // Abrir o claude e o servidor MCP leva ~1 s a mais na primeira pergunta
  // (medido em 12/11/2026: 2,0 s sem reserva, 1,1 s com). Fica um processo de
  // cada modelo já usado (e do padrão, desde o início) aberto à espera da
  // próxima conversa nova. Custa a memória de um processo a mais (~380 MB)
  // enquanto ele espera, por até 20 minutos; depois disso, ele fecha e a
  // conversa nova seguinte volta a esperar a abertura.
  const reservas = new Map<string, Processo>();
  function reservar(modelo: string) {
    if (!reserva || reservas.has(modelo)) return;
    const r: Processo = { modelo };
    iniciarProcesso(r);
    r.ociosa = setTimeout(() => {
      encerrarProcesso(r);
      reservas.delete(modelo);
    }, OCIOSA_MS);
    reservas.set(modelo, r);
  }
  function pegarReserva(modelo: string) {
    const r = reservas.get(modelo);
    if (!r) return undefined;
    reservas.delete(modelo);
    clearTimeout(r.ociosa);
    return r;
  }

  function terminar(p: Processo, fim: Parameters<Turno["terminar"]>[0]) {
    const t = p.turno;
    if (!t) return;
    p.turno = undefined;
    p.pedido = undefined;
    p.usoAnterior = undefined;
    t.terminar({ ...fim, session_id: p.sessionId });
    clearTimeout(p.ociosa);
    p.ociosa = setTimeout(() => encerrarProcesso(p), OCIOSA_MS);
  }

  function iniciarProcesso(p: Processo) {
    const o = opcoesAtuais();
    const args = [
      "-p",
      "--input-format",
      "stream-json",
      "--output-format",
      "stream-json",
      "--verbose",
      "--include-partial-messages",
      "--model",
      o.modelos[p.modelo] ?? p.modelo,
      ...o.args,
      ...argsExtras,
      ...(p.sessionId ? ["--resume", p.sessionId] : []),
    ];
    const proc = spawn("claude", args, {
      cwd: o.sessao,
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });
    p.proc = proc;
    let erros = "";
    proc.stderr!.on("data", (d) => {
      erros = (erros + d).slice(-2000);
    });
    createInterface({ input: proc.stdout! }).on("line", (linha) => {
      let msg: MensagemClaude;
      try {
        msg = JSON.parse(linha);
      } catch {
        return;
      }
      tratarMensagem(p, msg);
    });
    proc.on("exit", (codigo, sinal) => {
      if (p.proc === proc) p.proc = undefined;
      if (p.turno) {
        const motivo = encerrados.has(proc)
          ? null
          : `O processo do claude parou (código ${codigo ?? sinal}). ${erros.trim().slice(-400)}`;
        terminar(p, { interrompida: true, erro: motivo });
      }
    });
  }

  function tratarMensagem(p: Processo, msg: MensagemClaude) {
    if (msg.session_id) p.sessionId = msg.session_id;
    const t = p.turno;
    if (!t) return;

    if (msg.type === "stream_event") {
      const ev = msg.event;
      if (ev?.type === "content_block_start") {
        const tipo = ev.content_block?.type;
        if (tipo === "text") t.novoBlocoDeTexto();
        if (tipo === "thinking") t.pensando();
        if (tipo === "tool_use") {
          // Texto escrito antes de uma ferramenta é rascunho, não resposta.
          t.descartarTexto();
          t.preparando(ev.content_block?.name ?? "");
        }
      }
      if (ev?.type === "content_block_delta" && ev.delta?.type === "text_delta")
        t.texto(ev.delta.text ?? "");
      return;
    }

    const blocos = Array.isArray(msg.message?.content)
      ? msg.message.content
      : [];
    if (msg.type === "assistant") {
      for (const b of blocos)
        if (b.type === "tool_use" && b.id)
          t.ferramenta(
            b.id,
            String(b.name).replace(/^mcp__datane__/, ""),
            b.input,
          );
      return;
    }
    if (msg.type === "user") {
      for (const b of blocos) {
        if (b.type !== "tool_result" || !b.tool_use_id) continue;
        const texto = Array.isArray(b.content)
          ? b.content.map((x) => x.text ?? "").join("\n")
          : String(b.content ?? "");
        t.saida(b.tool_use_id, texto, Boolean(b.is_error));
      }
      return;
    }
    if (msg.type === "result") {
      const uso = somarUso(p.usoAnterior, {
        ...(msg.usage as object),
        rodadas: msg.num_turns,
      });
      // Conferência dos números: se algum não veio das ferramentas, o modelo
      // reescreve uma vez, na mesma sessão.
      const correcao = !msg.is_error && p.pedido ? acabar(p.pedido) : null;
      if (correcao && p.proc?.stdin?.writable) {
        p.usoAnterior = uso;
        p.proc.stdin.write(
          JSON.stringify({
            type: "user",
            message: { role: "user", content: correcao },
          }) + "\n",
        );
        return;
      }
      terminar(p, {
        ms: Date.now() - t.inicio,
        custo_usd: msg.total_cost_usd,
        uso,
        erro: msg.is_error ? String(msg.result ?? "erro") : null,
      });
    }
  }

  return {
    nome: "claude",
    modelos: opcoes.modelos,
    responder(pedido: Pedido) {
      let p = processos.get(pedido.conversa);
      if (!p) {
        const sessionId = pedido
          .anteriores()
          .findLast((t) => t.session_id)?.session_id;
        // Conversa retomada (--resume) não usa a reserva, que é uma sessão nova.
        p = (!sessionId && pegarReserva(pedido.modelo)) || {
          modelo: pedido.modelo,
          sessionId,
        };
        processos.set(pedido.conversa, p);
        reservar(pedido.modelo);
      }
      p.turno = pedido.turno;
      p.pedido = pedido;
      clearTimeout(p.ociosa);
      if (!p.proc) iniciarProcesso(p);
      p.proc!.stdin!.write(
        JSON.stringify({
          type: "user",
          message: {
            role: "user",
            content: paraOModelo(pedido.turno.pergunta),
          },
        }) + "\n",
      );
    },
    parar(conversa) {
      const p = processos.get(conversa);
      if (p?.turno) encerrarProcesso(p);
    },
    aquecer: reservar,
    esquecer(conversa) {
      const p = processos.get(conversa);
      if (p) encerrarProcesso(p);
      processos.delete(conversa);
    },
    encerrar() {
      for (const p of [...processos.values(), ...reservas.values()])
        encerrarProcesso(p);
    },
  };
}
