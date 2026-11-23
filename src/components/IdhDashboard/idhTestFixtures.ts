import { vi } from "vitest";
import type { IdhCardStates } from "@/features/panels/idh/idhCardState";
import type {
  IdhFilters,
  IdhPanelData,
  IdhYearPoint,
} from "@/features/panels/idh/idhPanel";

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
 * Instala no jsdom o que o painel de IDH usa e o jsdom não tem.
 *
 * @example beforeEach(stubIdhBrowserApis)
 */
export const stubIdhBrowserApis = () => {
  vi.stubGlobal("ResizeObserver", ResizeObserverFake);
  vi.stubGlobal("IntersectionObserver", IntersectionObserverFake);
  vi.stubGlobal("matchMedia", (media: string) => new MediaQueryListFake(media));

  // A barra de abas rola até a aba aberta; o jsdom não tem `Element.scrollTo`.
  Element.prototype.scrollTo = () => {};
};

const yearPoint = (ano: number, idh: number): IdhYearPoint => ({
  ano,
  idh,
  idhAjustado: idh - 0.2,
  gini: 0.55,
  rendaPerCapita: 467.43,
  rendimento: 934.08,
});

/**
 * Painel de IDH pequeno, com dois estados e dois anos, para testes de tela.
 *
 * @example idhPanelFixture({ ano: 2021, visao: "geral", uf: "PE" })
 */
export const idhPanelFixture = (filters: IdhFilters): IdhPanelData => ({
  filters,
  yearRange: { first: 2012, last: 2021 },
  ufs: [
    { sigla: "CE", nome: "Ceará" },
    { sigla: "PE", nome: "Pernambuco" },
  ],
  serie: [yearPoint(2020, 0.69), yearPoint(2021, 0.71)],
  mapa: [
    { code: "CE", name: "Ceará", uf: "CE", value: 0.7 },
    { code: "PE", name: "Pernambuco", uf: "PE", value: 0.72 },
  ],
  sexo: [],
  cor: [],
});

/**
 * Todos os cards no mesmo estado.
 *
 * @example allIdhCards("loading").map // "loading"
 */
export const allIdhCards = (
  state: IdhCardStates[keyof IdhCardStates],
): IdhCardStates => ({
  bigNumbers: state,
  evolution: state,
  map: state,
  ranking: state,
  groups: state,
});
