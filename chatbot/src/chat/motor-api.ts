/**
 * Motor "api" da página de chat: fala direto com a API da Anthropic (chave em
 * ANTHROPIC_API_KEY) e roda as ferramentas neste mesmo processo.
 *
 * Para quando houver chave (um beta para a equipe). O motor "claude" (motor-claude.ts) abre um `claude` com
 * um servidor MCP por conversa, uns 380 MB cada, por 20 minutos; aqui uma
 * conversa a mais é só o histórico dela na memória.
 *
 * Variáveis de ambiente:
 *   ANTHROPIC_API_KEY       chave da API (obrigatória)
 *   DATANE_CHAT_ESFORCO      low | medium | high (padrão: o do modelo)
 *   DATANE_CHAT_RODADAS      máximo de idas ao modelo por pergunta (padrão 8)
 */
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { z } from "zod";
import { FERRAMENTAS } from "../ferramentas/index.ts";
import { promptDoSistema } from "../prompt-sistema.ts";
import type { Motor, Pedido } from "./turno.ts";
import { paraOModelo } from "./lingua.ts";
import { acabar } from "./acabamento.ts";
import { PRECOS } from "./precos.ts";
import { classificarFalha, mensagemDaFalha, type Falha } from "./disponibilidade.ts";

type Mensagem = Anthropic.Beta.BetaMessageParam;

export const MODELOS: Record<string, string> = {
  haiku: "claude-haiku-5-5",
  sonnet: "claude-sonnet-5-5",
};


const RODADAS = Number(process.env.DATANE_CHAT_RODADAS ?? 8);
const ESFORCO = process.env.DATANE_CHAT_ESFORCO as
  "low" | "medium" | "high" | undefined;
// A resposta é curta; o teto cobre o raciocínio do modelo antes dela.
const MAX_TOKENS = 16_000;

const ESQUEMAS = new Map(FERRAMENTAS.map((f) => [f.nome, z.object(f.entrada)]));

const TOOLS: Anthropic.Beta.BetaTool[] = FERRAMENTAS.map((f) => {
  const esquema = z.toJSONSchema(z.object(f.entrada)) as Record<
    string,
    unknown
  >;
  // O "$schema" do zod não faz parte do que a API espera.
  delete esquema.$schema;
  return {
    name: f.nome,
    description: f.descricao,
    input_schema: esquema as Anthropic.Beta.BetaTool.InputSchema,
    // A entrada chega aos poucos, como o texto; quem valida é o ESQUEMAS.
    eager_input_streaming: true,
  };
});

function sistema(): Anthropic.Beta.BetaTextBlockParam[] {
  // O mesmo prompt do motor claude. Muda só uma vez por dia (a data), então o
  // cache do prompt e das ferramentas vale para todas as conversas do dia.
  // PERF: 1 hora, não 5 minutos. Prompt e ferramentas são ~29 mil tokens; com
  // 5 minutos, numa equipe que pergunta de vez em quando, quase toda pergunta
  // grava tudo de novo (~US$ 0,0036 no Haiku, mais que o resto da pergunta).
  // A gravação de 1 hora custa 2× a entrada em vez de 1,25×: compensa a partir
  // de 2 perguntas por hora com mais de 5 minutos entre elas. A conversa
  // continua no cache de 5 minutos (o mais longo precisa vir antes).
  return [
    {
      type: "text",
      text: promptDoSistema(),
      cache_control: { type: "ephemeral", ttl: "1h" },
    },
  ];
}

type Uso = {
  entrada: number;
  saida: number;
  cache_leitura: number;
  cache_escrita: number;
  /** A parte de cache_escrita gravada por 1 hora (o prompt e as ferramentas). */
  cache_escrita_1h: number;
  rodadas: number;
};

function custo(modelo: string, u: Uso) {
  const p = PRECOS[modelo];
  if (!p) return undefined;
  return (
    (u.entrada * p.entrada +
      u.saida * p.saida +
      u.cache_leitura * p.leitura +
      (u.cache_escrita - u.cache_escrita_1h) * p.escrita +
      u.cache_escrita_1h * 2 * p.entrada) /
    1e6
  );
}

type Estado = {
  mensagens: Mensagem[];
  controle?: AbortController;
};

type OpcoesDoMotor = {
  cliente?: Anthropic;
  /** Avisa o servidor de cada falha da API (ver disponibilidade.ts). */
  aoFalhar?: (f: Falha) => void;
};

/**
 * Tira do histórico a conversa interna do turno: rascunho, pedido de
 * conferência da página e a volta do modelo (às vezes só "OK"). Fica no lugar
 * a resposta que a pessoa viu. Sem isso, na pergunta seguinte o modelo lia a
 * conferência como parte da conversa e falava dela ("errei ao responder só OK
 * à mensagem de conferência", UR20 em exp-b-indice, 25/11/2026).
 *
 *   fecharConferencia(mensagens, indiceDoRascunho, turno.resposta);
 */
export function fecharConferencia(mensagens: Mensagem[], inicio: number, resposta: string): void {
  if (!resposta.trim() || inicio < 1 || inicio >= mensagens.length) return;
  mensagens.splice(inicio, mensagens.length - inicio, { role: "assistant", content: resposta });
}

export function criarMotorApi(opcoes: OpcoesDoMotor = {}): Motor {
  let cliente = opcoes.cliente;
  const conversas = new Map<string, Estado>();

  function estadoDa(pedido: Pedido): Estado {
    let e = conversas.get(pedido.conversa);
    if (!e) {
      // Conversa que não está na memória (o servidor reiniciou): retoma só com
      // o texto das perguntas e respostas, sem as consultas.
      e = {
        mensagens: pedido.anteriores().flatMap((t): Mensagem[] => [
          { role: "user", content: t.pergunta },
          { role: "assistant", content: t.resposta || "(sem resposta)" },
        ]),
      };
      conversas.set(pedido.conversa, e);
    }
    return e;
  }

  async function responder(pedido: Pedido) {
    cliente ??= new Anthropic();
    const { turno, contexto } = pedido;
    const modelo = MODELOS[pedido.modelo] ?? pedido.modelo;
    const estado = estadoDa(pedido);
    const antes = estado.mensagens.length;
    const mensagens = estado.mensagens;
    mensagens.push({ role: "user", content: paraOModelo(turno.pergunta) });
    const controle = new AbortController();
    estado.controle = controle;
    const uso: Uso = {
      entrada: 0,
      saida: 0,
      cache_leitura: 0,
      cache_escrita: 0,
      cache_escrita_1h: 0,
      rodadas: 0,
    };
    const sonnet = modelo.startsWith("claude-sonnet");
    let erro: string | null = null;
    let interrompida = false;
    // Onde começa a conversa interna com a página (rascunho e conferência).
    let inicioDaConferencia: number | undefined;

    try {
      for (let rodada = 1; ; rodada++) {
        // Na última rodada o modelo não pode mais chamar ferramenta: responde
        // com o que já consultou, em vez de a pergunta acabar sem resposta.
        const ultima = rodada >= RODADAS;
        const stream = cliente.beta.messages.stream(
          {
            model: modelo,
            max_tokens: MAX_TOKENS,
            system: sistema(),
            tools: TOOLS,
            tool_choice: ultima ? { type: "none" } : { type: "auto" },
            messages: mensagens,
            // Guarda em cache a conversa até aqui: cada rodada reenvia tudo.
            cache_control: { type: "ephemeral" },
            ...(ESFORCO ? { output_config: { effort: ESFORCO } } : {}),
            ...(contexto.email
              ? {
                  metadata: {
                    user_id: createHash("sha256")
                      .update(contexto.email)
                      .digest("hex")
                      .slice(0, 32),
                  },
                }
              : {}),
            // Se o Sonnet 5.5 recusar por engano, a API tenta outro modelo na
            // mesma chamada (o Haiku 5.5 não tem essa opção).
            ...(sonnet
              ? {
                  betas: ["server-side-fallback-2026-07-01"],
                  fallbacks: "default" as const,
                }
              : {}),
          },
          { signal: controle.signal },
        );

        for await (const ev of stream) {
          if (ev.type === "content_block_start") {
            const tipo = ev.content_block.type;
            if (tipo === "thinking" || tipo === "redacted_thinking")
              turno.pensando();
            else if (tipo === "tool_use") {
              // Texto escrito antes de uma ferramenta é rascunho, não resposta.
              turno.descartarTexto();
              turno.preparando(ev.content_block.name);
            }
            else if (tipo === "text") turno.novoBlocoDeTexto();
          } else if (
            ev.type === "content_block_delta" &&
            ev.delta.type === "text_delta"
          ) {
            turno.texto(ev.delta.text);
          }
        }
        const msg = await stream.finalMessage();
        uso.rodadas += 1;
        uso.entrada += msg.usage.input_tokens;
        uso.saida += msg.usage.output_tokens;
        uso.cache_leitura += msg.usage.cache_read_input_tokens ?? 0;
        uso.cache_escrita += msg.usage.cache_creation_input_tokens ?? 0;
        uso.cache_escrita_1h +=
          msg.usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;

        if (msg.stop_reason === "refusal") {
          erro = "O modelo não quis responder esta pergunta.";
          break;
        }
        const usos = msg.content.filter(
          (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use",
        );
        // Guarda a resposta inteira (raciocínio incluído): o modelo precisa
        // dela sem mudanças na próxima rodada.
        mensagens.push({ role: "assistant", content: msg.content });
        if (!usos.length) {
          // Conferência dos números: se algum não veio das ferramentas, o
          // modelo reescreve uma vez.
          const correcao = msg.stop_reason === "end_turn" ? acabar(pedido) : null;
          if (!correcao) break;
          inicioDaConferencia ??= mensagens.length - 1;
          mensagens.push({ role: "user", content: correcao });
          continue;
        }
        if (msg.stop_reason === "max_tokens") {
          erro = "A resposta passou do tamanho máximo antes de terminar.";
          break;
        }

        for (const b of usos) turno.ferramenta(b.id, b.name, b.input);
        const resultados = await Promise.all(
          usos.map(
            async (b): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
              const ferramenta = FERRAMENTAS.find((f) => f.nome === b.name);
              const entrada = ESQUEMAS.get(b.name)?.safeParse(b.input);
              let texto: string;
              let falhou = false;
              if (!ferramenta || !entrada?.success) {
                falhou = true;
                texto = ferramenta
                  ? `Entrada inválida para ${b.name}: ${entrada?.error?.message}. Corrija e chame de novo.`
                  : `Ferramenta desconhecida: ${b.name}.`;
              } else {
                try {
                  texto = await ferramenta.executar(
                    entrada.data as never,
                    contexto,
                  );
                } catch (e) {
                  falhou = true;
                  texto = `A ferramenta falhou: ${(e as Error).message}`;
                }
              }
              turno.saida(b.id, texto, falhou);
              return {
                type: "tool_result",
                tool_use_id: b.id,
                content: texto,
                ...(falhou ? { is_error: true } : {}),
              };
            },
          ),
        );
        if (controle.signal.aborted) throw new Anthropic.APIUserAbortError();
        mensagens.push({ role: "user", content: resultados });
      }
    } catch (e) {
      if (controle.signal.aborted) interrompida = true;
      else {
        const falha = classificarFalha(e);
        erro = mensagemDaFalha(falha);
        opcoes.aoFalhar?.(falha);
        console.error(JSON.stringify({ event: "falha_na_api", conversa: pedido.conversa, ...falha, mensagem: (e as Error)?.message }));
      }
    }

    if (erro || interrompida) {
      // Uma resposta que não terminou deixa o histórico pela metade (uma
      // ferramenta sem resultado, por exemplo), e a próxima pergunta seria
      // recusada pela API. Fica só o texto que chegou a aparecer.
      mensagens.splice(
        antes,
        mensagens.length - antes,
        { role: "user", content: turno.pergunta },
        {
          role: "assistant",
          content: turno.resposta || "(resposta interrompida antes de começar)",
        },
      );
    } else if (inicioDaConferencia !== undefined)
      fecharConferencia(mensagens, inicioDaConferencia, turno.resposta);
    if (estado.controle === controle) estado.controle = undefined;
    turno.terminar({
      ms: Date.now() - turno.inicio,
      custo_usd: custo(modelo, uso),
      uso,
      erro,
      interrompida,
    });
  }

  return {
    nome: "api",
    modelos: MODELOS,
    responder(pedido) {
      void responder(pedido);
    },
    parar(conversa) {
      conversas.get(conversa)?.controle?.abort();
    },
    esquecer(conversa) {
      conversas.get(conversa)?.controle?.abort();
      conversas.delete(conversa);
    },
    encerrar() {
      for (const e of conversas.values()) e.controle?.abort();
    },
  };
}
