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

const HTML_ENTITIES_MAP: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ccedil: "ç",
  Ccedil: "Ç",
  aacute: "á",
  Aacute: "Á",
  eacute: "é",
  Eacute: "É",
  iacute: "í",
  Iacute: "Í",
  oacute: "ó",
  Oacute: "Ó",
  uacute: "ú",
  Uacute: "Ú",
  atilde: "ã",
  Atilde: "Ã",
  otilde: "õ",
  Otilde: "Õ",
  acirc: "â",
  Acirc: "Â",
  ecirc: "ê",
  Ecirc: "Ê",
  ocirc: "ô",
  Ocirc: "Ô",
  agrave: "à",
  Agrave: "À",
};

export const decodeHtmlEntities = (str: string): string => {
  return str.replace(/&(#?[a-zA-Z0-9]+);/g, (match, entity) => {
    if (entity.startsWith("#")) {
      const isHex = entity[1]?.toLowerCase() === "x";
      const code = parseInt(entity.substring(isHex ? 2 : 1), isHex ? 16 : 10);

      return isNaN(code) ? match : String.fromCodePoint(code);
    }

    return HTML_ENTITIES_MAP[entity] || match;
  });
};

export const stripHtml = (value = "") =>
  decodeHtmlEntities(value.replace(/<[^>]*>/g, " "))
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
