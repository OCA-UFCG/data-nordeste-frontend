export const CONTENT_CACHE_PAGE_PATH = "/atualizar-conteudo";

export const CONTENT_CACHE_STATUS_MESSAGES = {
  "atualizado":
    "Pronto. Cada página do site vai buscar o conteúdo novo do Contentful na próxima visita.",
  "senha-incorreta": "Senha incorreta. Tente de novo.",
  "indisponivel":
    "A atualização não está configurada neste ambiente. Fale com a equipe de desenvolvimento.",
} as const;

export type ContentCacheStatus = keyof typeof CONTENT_CACHE_STATUS_MESSAGES;

export const isContentCacheStatus = (
  value: unknown,
): value is ContentCacheStatus =>
  typeof value === "string" && value in CONTENT_CACHE_STATUS_MESSAGES;
