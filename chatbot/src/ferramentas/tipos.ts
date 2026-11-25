import type { z } from "zod";

/** O que muda de uma pergunta para outra e as ferramentas precisam saber. */
export type Contexto = {
  /** E-mail de quem perguntou (só existirá com login; localmente fica vazio). */
  email?: string;
};

/** Uma ferramenta do bot: a mesma definição serve ao servidor MCP e ao motor da API. */
export type Ferramenta = {
  nome: string;
  titulo: string;
  descricao: string;
  entrada: z.ZodRawShape;
  executar: (args: never, ctx: Contexto) => Promise<string>;
};
