import { getSearchIndex } from "@/features/search/contentful";

// Cache só no navegador e na CDN; o servidor já guarda o conteúdo do Contentful
// até alguém atualizar em /atualizar-conteudo.
const SEARCH_INDEX_HTTP_CACHE_SECONDS = 600;

export async function GET() {
  const index = await getSearchIndex();

  return Response.json(index, {
    headers: {
      "Cache-Control": `public, s-maxage=${SEARCH_INDEX_HTTP_CACHE_SECONDS}, stale-while-revalidate=${SEARCH_INDEX_HTTP_CACHE_SECONDS}`,
    },
  });
}
