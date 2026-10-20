/**
 * Picks the text Google shows under the page title in search results.
 *
 * The editorial `seoDescription` field in Contentful wins when filled; entries
 * still without it fall back to the page's own description so nothing goes blank
 * while the content team fills the field entry by entry.
 *
 * Usage: pickSearchSnippet(panel.seoDescription, panelDescriptionText)
 */
export const pickSearchSnippet = (
  seoDescription: string | null | undefined,
  fallbackDescription: string,
): string => {
  const snippet = seoDescription?.trim();

  return snippet || fallbackDescription;
};
