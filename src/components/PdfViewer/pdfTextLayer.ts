import { TextLayer, type PageViewport, type PDFPageProxy } from "pdfjs-dist";

/**
 * Prepares the page's text, transparent, to lie over its canvas so screen
 * readers can read the PDF and people can select and copy it (WCAG 1.1.1).
 * Without it the viewer exposes only an image of each page.
 *
 * Returned unrendered so the caller can keep it and `cancel()` mid-render.
 *
 * @example
 * const layer = createPdfTextLayer(page, textLayerDiv, displayViewport);
 * await layer.render(); // on cleanup: layer.cancel();
 */
export const createPdfTextLayer = (
  page: PDFPageProxy,
  container: HTMLDivElement,
  viewport: PageViewport,
): TextLayer => {
  // IMPORTANT: pdf.js sizes the layer with calc(var(--scale-factor) * pt), so
  // it must match the scale the canvas is displayed at or the text drifts.
  container.style.setProperty("--scale-factor", String(viewport.scale));
  container.replaceChildren();

  return new TextLayer({
    textContentSource: page.streamTextContent(),
    container,
    viewport,
  });
};
