import { vi } from "vitest";

// jsdom não tem layout: o observador nunca dispara, então os gráficos que
// medem a largura (linha, carrossel) ficam sem desenhar, o que basta aqui.
class ResizeObserverFake {
  observe() {}

  unobserve() {}

  disconnect() {}
}

// O embla observa quais slides estão visíveis; sem layout, nenhum está.
class IntersectionObserverFake {
  observe() {}

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

// O embla e o "Saiba mais" consultam media queries; nenhuma casa no jsdom.
class MediaQueryListFake {
  matches = false;

  constructor(readonly media: string) {}

  addEventListener() {}

  removeEventListener() {}

  addListener() {}

  removeListener() {}
}

/**
 * Instala no jsdom o que os painéis do protótipo usam e o jsdom não tem.
 *
 * @example beforeEach(stubPanelBrowserApis)
 */
export const stubPanelBrowserApis = () => {
  vi.stubGlobal("ResizeObserver", ResizeObserverFake);
  vi.stubGlobal("IntersectionObserver", IntersectionObserverFake);
  vi.stubGlobal("matchMedia", (media: string) => new MediaQueryListFake(media));

  // A barra de abas do IDH rola até a aba aberta; o jsdom não tem `Element.scrollTo`.
  Element.prototype.scrollTo = () => {};
};
