export const CONTENT_REVALIDATE_SECONDS =
  process.env.NEXT_PUBLIC_APP_ENV === "beta" ||
  process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW
    ? 60
    : 3600;
