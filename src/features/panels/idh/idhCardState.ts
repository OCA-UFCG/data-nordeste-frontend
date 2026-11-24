import {
  type PanelCardState,
  type PanelLoadRequest,
  resolveDependentCardStates,
} from "@/features/panels/panelCardState";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";

// Estados de PanelCardState menos `stale`: no IDH, o card cujo dado
// muda com o filtro pedido mostra o esqueleto (`loading`) até o servidor
// responder, em vez do dado anterior esmaecido dos outros painéis.
export type IdhCardState = Exclude<PanelCardState, "stale">;

type IdhFilterKey = "uf" | "ano";

// De quais filtros o dado de cada card depende. O ano escolhido na série e o
// estado destacado no mapa e no ranking vêm do filtro pedido (seleção
// otimista), então não contam: só o que exige dado novo do servidor.
// IMPORTANT: o mapa (MapLibre) desenha os geodados do ano pedido e não lê dado
// do servidor; com `ano` aqui, cada troca de ano o trocava pelo esqueleto e
// remontava o mapa (novo contexto WebGL, geodados de novo, câmera perdida).
const IDH_CARD_DEPENDENCIES = {
  bigNumbers: ["uf", "ano"],
  evolution: ["uf"],
  map: [],
  ranking: ["ano"],
  groups: ["uf", "ano"],
} as const satisfies Record<string, readonly IdhFilterKey[]>;

export type IdhCardKey = keyof typeof IDH_CARD_DEPENDENCIES;

export type IdhCardStates = Record<IdhCardKey, IdhCardState>;

export type IdhLoadStatus = PanelLoadRequest<IdhFilters>;

/**
 * Estado de cada card do painel. Só o card cujo dado muda com o filtro pedido
 * vira esqueleto: trocar a UF não mexe no mapa nem no ranking.
 *
 * @example resolveIdhCardStates({ failed: false, retrying: false, pending: { ...filters, uf: "PE" } }, filters).evolution // "loading"
 */
export const resolveIdhCardStates = (
  status: IdhLoadStatus,
  current: IdhFilters,
): IdhCardStates => {
  const states = resolveDependentCardStates(
    status,
    current,
    IDH_CARD_DEPENDENCIES,
  );
  const cards = Object.keys(states) as IdhCardKey[];

  return Object.fromEntries(
    cards.map((card) => [
      card,
      states[card] === "stale" ? "loading" : states[card],
    ]),
  ) as IdhCardStates;
};
