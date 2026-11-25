/**
 * O que o chat diz quando a Anthropic não responde, e quando parar de tentar.
 *
 * Falha duradoura (chave recusada, crédito acabou, modelo retirado) não se
 * resolve sozinha em segundos: o chat fica "indisponível" por uma pausa e
 * recusa as perguntas sem chamar a API. Depois da pausa tenta de novo, então
 * repor o crédito ou trocar a chave volta o chat sem reiniciar o servidor.
 *
 *   const d = criarDisponibilidade();
 *   d.registrar(classificarFalha(erroDaApi));
 *   d.recusa(); // "O assistente está indisponível no momento…" ou null
 */

export type TipoDeFalha =
  | "chave_recusada"
  | "credito_acabou"
  | "modelo_sumiu"
  | "muitos_pedidos"
  | "fora_do_ar"
  | "inesperada";

export type Falha = { tipo: TipoDeFalha; duradoura: boolean; status?: number };

export const INDISPONIVEL = "O assistente está indisponível no momento. Tente de novo mais tarde.";

// Texto para quem usa: sem "API", "chave" nem código de erro. O detalhe
// técnico vai para o log (evento falha_na_api).
const MENSAGENS: Record<TipoDeFalha, string> = {
  chave_recusada: INDISPONIVEL,
  credito_acabou: INDISPONIVEL,
  modelo_sumiu: INDISPONIVEL,
  fora_do_ar: "O assistente está indisponível no momento. Tente de novo em alguns minutos.",
  muitos_pedidos: "O assistente está recebendo muitas perguntas agora. Tente de novo em um minuto.",
  inesperada: "Não consegui terminar esta resposta. Tente de novo; se continuar, avise a equipe do Data Nordeste.",
};

export function mensagemDaFalha(f: Falha): string {
  return MENSAGENS[f.tipo];
}

/** Lê o erro do SDK pelo status HTTP (o SDK cria uma classe por status). */
export function classificarFalha(e: unknown): Falha {
  const status = (e as { status?: unknown })?.status;
  const texto = String((e as Error)?.message ?? "");
  if (typeof status !== "number") {
    // Sem status: não chegou resposta (rede, tempo esgotado).
    const semRede = /connection|timeout|timed out|fetch failed|ECONN|ENOTFOUND/i.test(`${(e as Error)?.name} ${texto}`);

    return { tipo: semRede ? "fora_do_ar" : "inesperada", duradoura: false };
  }
  if (status === 401 || status === 403) return { tipo: "chave_recusada", duradoura: true, status };

  // INTENTIONAL: crédito esgotado chega como 400 com "credit balance is too low".
  if (status === 402 || (status === 400 && /credit balance/i.test(texto)))
    return { tipo: "credito_acabou", duradoura: true, status };
  if (status === 404) return { tipo: "modelo_sumiu", duradoura: true, status };
  if (status === 429) return { tipo: "muitos_pedidos", duradoura: false, status };
  if (status >= 500) return { tipo: "fora_do_ar", duradoura: false, status };

  return { tipo: "inesperada", duradoura: false, status };
}

export type Disponibilidade = {
  registrar(f: Falha): void;
  /** Mensagem para recusar a pergunta, ou null se pode tentar. */
  recusa(): string | null;
  estado(): { disponivel: boolean; motivo: TipoDeFalha | null };
};

export function criarDisponibilidade(agora: () => number = Date.now, pausaMs = 10 * 60_000): Disponibilidade {
  let foraAte = 0;
  let motivo: TipoDeFalha | null = null;
  const fora = () => agora() < foraAte;

  return {
    registrar(f) {
      if (!f.duradoura) return;
      foraAte = agora() + pausaMs;
      motivo = f.tipo;
    },
    recusa: () => (fora() ? INDISPONIVEL : null),
    estado: () => ({ disponivel: !fora(), motivo: fora() ? motivo : null }),
  };
}
