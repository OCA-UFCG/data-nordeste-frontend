/** Preços da API usados no custo do chat (motor-api.ts) e dos juízes (juiz-claude.ts). */

// US$ por milhão de tokens. Cache: escrita 1,25× a entrada (5 min) ou 2× (1 h,
// ver sistema() em motor-api.ts); leitura 0,1× no Haiku e US$ 0,10 no Sonnet 5.5. No Haiku,
// prompts acima de 100 mil tokens custam mais; aqui uma pergunta fica em ~30 mil.
export const PRECOS: Record<
  string,
  { entrada: number; saida: number; leitura: number; escrita: number }
> = {
  "claude-haiku-5-5": {
    entrada: 0.1,
    saida: 0.5,
    leitura: 0.01,
    escrita: 0.125,
  },
  "claude-sonnet-5-5": { entrada: 2, saida: 10, leitura: 0.1, escrita: 2.5 },
};
