export const CONTENT_REVALIDATE_SECONDS =
  process.env.NEXT_PUBLIC_APP_ENV === "beta" ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW
    ? 60
    : 3600;

// Os dados das demos (IBGE, PNUD) mudam no máximo uma vez por mês.
export const DATA_DB_CACHE_SECONDS = 24 * 60 * 60;
