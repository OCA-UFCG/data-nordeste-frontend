import type { MetadataRoute } from "next";

// IMPORTANT: estas rotas montam a consulta ao Contentful a partir da query
// string (filtro, página, ordenação). O cache do Next é separado por
// variáveis da consulta, então cada combinação nova que um crawler visita
// gasta uma requisição da cota mensal de 100K da API. Em out/2026 cerca de 2/3
// do GraphQL vinham de bots percorrendo essas combinações. As páginas
// canônicas (sem "?") continuam liberadas e no sitemap. Se outra rota passar
// a ler `searchParams` para consultar o Contentful, inclua-a aqui.
export const CONTENTFUL_QUERY_STRING_ROUTES = ["/posts?", "/explore?"];

// INTENTIONAL: /catalog?page=N fica liberado. A paginação vem do Zenodo, não
// do Contentful, e é por ela que o Google acha os datasets além dos 25 do
// sitemap.

// Rotas que não devem ser rastreadas em nenhuma variante: /search é página de
// resultado de busca (conteúdo duplicado, sem valor no índice; não gasta cota,
// pois filtra em memória o índice de uma consulta única) e /atualizar-conteudo
// é operacional. "$" evita bloquear /search-index.json, que o /explore baixa.
export const NEVER_CRAWLED_ROUTES = [
  "/search$",
  "/search?",
  "/atualizar-conteudo",
];

const INFRA_ROUTES = ["/api/", "/health"];

/**
 * Monta o robots.txt para o ambiente informado. Só produção libera as páginas
 * canônicas, bloqueando as variantes que gastam cota do Contentful; qualquer
 * outro ambiente (ou variável ausente) bloqueia tudo.
 *
 * @example buildRobotsRules("prod", "https://datanordeste.sudene.gov.br")
 */
export const buildRobotsRules = (
  appEnv: string | undefined,
  siteUrl: string,
): MetadataRoute.Robots => {
  const sitemap = `${siteUrl}/sitemap.xml`;

  if (appEnv !== "prod") {
    return { rules: { userAgent: "*", disallow: "/" }, sitemap };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...INFRA_ROUTES,
        ...NEVER_CRAWLED_ROUTES,
        ...CONTENTFUL_QUERY_STRING_ROUTES,
      ],
    },
    sitemap,
  };
};
