import {
  type PanelCardState,
  type PanelLoadRequest,
  resolveDependentCardStates,
} from "@/features/panels/panelCardState";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";

// Estados documentados em PanelCardState; o IDH usa a mesma regra dos demais painéis.
export type IdhCardState = PanelCardState;

type IdhFilterKey = "uf" | "ano";

// De quais filtros o dado de cada card depende. O ano escolhido na série e o
// estado destacado no mapa e no ranking vêm do filtro pedido (seleção
// otimista), então não contam: só o que exige dado novo do servidor.
const IDH_CARD_DEPENDENCIES = {
  bigNumbers: ["uf", "ano"],
  evolution: ["uf"],
  map: ["ano"],
  ranking: ["ano"],
  groups: ["uf", "ano"],
} as const satisfies Record<string, readonly IdhFilterKey[]>;

export type IdhCardKey = keyof typeof IDH_CARD_DEPENDENCIES;

export type IdhCardStates = Record<IdhCardKey, IdhCardState>;

export type IdhLoadStatus = PanelLoadRequest<IdhFilters>;

/**
 * Estado de cada card do painel. Só esmaece o card cujo dado muda com o
 * filtro pedido: trocar a UF não mexe no mapa nem no ranking.
 *
 * @example resolveIdhCardStates({ failed: false, retrying: false, pending: { ...filters, uf: "PE" } }, filters).map // "ok"
 */
export const resolveIdhCardStates = (
  status: IdhLoadStatus,
  current: IdhFilters,
): IdhCardStates =>
  resolveDependentCardStates(status, current, IDH_CARD_DEPENDENCIES);

/**
 * O card tem dado para mostrar (atual ou anterior esmaecido).
 *
 * @example showsIdhData("stale") // true
 */
export const showsIdhData = (state: IdhCardState): boolean =>
  state === "ok" || state === "stale";
