import type { IdhCardStates } from "@/features/panels/idh/idhCardState";
import type {
  IdhFilters,
  IdhPanelData,
  IdhYearPoint,
} from "@/features/panels/idh/idhPanel";

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
