const GOV_BR_HOST = "www.gov.br";
const PLONE_DOWNLOAD_SUFFIX = "/@@download/file";

/**
 * Resolves a boletim `link` from Contentful to a URL that serves PDF bytes.
 *
 * IMPORTANT: gov.br (Plone) answers `…/arquivo.pdf` with its HTML view page;
 * the binary only comes from `…/arquivo.pdf/@@download/file`. Contentful links
 * keep the plain file path, so pdf.js would receive HTML without this rewrite.
 *
 * Usage: resolvePdfDownloadUrl("https://www.gov.br/sudene/a.pdf")
 *   => "https://www.gov.br/sudene/a.pdf/@@download/file"
 */
export const resolvePdfDownloadUrl = (pdfUrl: string): string => {
  const url = new URL(pdfUrl);

  if (url.hostname !== GOV_BR_HOST) return pdfUrl;
  if (url.pathname.endsWith(PLONE_DOWNLOAD_SUFFIX)) return pdfUrl;

  url.pathname = url.pathname.replace(/\/$/, "") + PLONE_DOWNLOAD_SUFFIX;

  return url.toString();
};
