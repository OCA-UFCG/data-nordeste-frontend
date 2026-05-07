import type { Metadata } from "next";

export const SITE_NAME = "Data Nordeste";
export const SITE_DESCRIPTION =
  "Portal público da SUDENE para consulta, visualização e download de dados, indicadores, painéis e publicações sobre o Nordeste brasileiro.";

export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_HOST_URL ||
  "https://datanordeste.sudene.gov.br"
).replace(/\/+$/, "");

export const buildPageTitle = (title: string) => `${title} | ${SITE_NAME}`;

export const absoluteUrl = (path = "/") =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

export const stripHtml = (value = "") =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const truncateDescription = (value: string, maxLength = 155) => {
  const normalized = stripHtml(value);

  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength - 1).trim()}...`;
};

export const buildMetadata = ({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  images = ["/banner.png"],
}: {
  title?: string;
  description?: string;
  path?: string;
  images?: string[];
}): Metadata => {
  const finalTitle = title ? buildPageTitle(title) : SITE_NAME;
  const finalDescription = truncateDescription(description) || SITE_DESCRIPTION;
  const url = absoluteUrl(path);

  return {
    title: finalTitle,
    description: finalDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url,
      siteName: SITE_NAME,
      locale: "pt_BR",
      type: "website",
      images: images.map((image) => ({
        url: absoluteUrl(image),
      })),
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: images.map((image) => absoluteUrl(image)),
    },
  };
};
