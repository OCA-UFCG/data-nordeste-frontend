// O conteúdo do Contentful fica em cache sem prazo: as visitas não gastam a
// cota da API. Ele só é buscado de novo quando alguém pede em
// /atualizar-conteudo, que invalida a tag abaixo.
export const CONTENT_REVALIDATE = false;
export const CONTENTFUL_CACHE_TAG = "contentful";
