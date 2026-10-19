// Shared with HubTemplate (the <main> id) and HomeScrollButton (which walks
// its children), so the three never drift apart.
export const MAIN_CONTENT_ID = "root";

/**
 * First tab stop of every page, hidden until focused, so keyboard users can
 * jump past the header (logo, search and every menu item) straight to
 * `<main>`. Ported from the Atlas da Desertificação SkipLink.
 *
 * @example
 * <SkipLink />
 * <Header />
 * <main id={MAIN_CONTENT_ID} tabIndex={-1}>…</main>
 */
export const SkipLink = () => (
  <a
    href={`#${MAIN_CONTENT_ID}`}
    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-grey-900 focus:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-800"
  >
    Pular para o conteúdo principal
  </a>
);
