import {
  resolvePanelCardState,
  type PanelCardState,
} from "@/features/panels/panelCardState";
import type { IdhFilters } from "@/features/panels/idh/idhPanel";

// Estados documentados em PanelCardState; o IDH usa a mesma regra dos demais
// painéis. No IDH, `stale` quer dizer que um filtro de que o card depende está
// a caminho, e `loading` só aparece quando não há dado anterior para mostrar
// (a consulta falhou e está sendo refeita).
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

export type IdhLoadStatus = {
  failed: boolean;
  retrying: boolean;

  // Filtros pedidos enquanto a navegação está pendente; null fora dela.
  pending: IdhFilters | null;
};

const resolveCardState = (
  { failed, retrying, pending }: IdhLoadStatus,
  current: IdhFilters,
  dependsOn: readonly IdhFilterKey[],
): IdhCardState => {
  // Recarregar vence o erro: sem essa prioridade o "Tentar de novo" nunca
  // mostraria o esqueleto nem desabilitaria o botão (revisão da PR #397).
  if (failed) {
    return resolvePanelCardState({
      failed,
      loading: retrying || pending !== null,
    });
  }
  if (!pending) return "ok";

  return dependsOn.some((key) => pending[key] !== current[key])
    ? "stale"
    : "ok";
};

/**
 * Estado de cada card do painel. Só esmaece o card cujo dado muda com o
 * filtro pedido: trocar a UF não mexe no mapa nem no ranking.
 *
 * @example resolveIdhCardStates({ failed: false, retrying: false, pending: { ...filters, uf: "PE" } }, filters).map // "ok"
 */
export const resolveIdhCardStates = (
  status: IdhLoadStatus,
  current: IdhFilters,
): IdhCardStates => {
  const keys = Object.keys(IDH_CARD_DEPENDENCIES) as IdhCardKey[];

  return Object.fromEntries(
    keys.map((key) => [
      key,
      resolveCardState(status, current, IDH_CARD_DEPENDENCIES[key]),
    ]),
  ) as IdhCardStates;
};

/**
 * O card tem dado para mostrar (atual ou anterior esmaecido).
 *
 * @example showsIdhData("stale") // true
 */
export const showsIdhData = (state: IdhCardState): boolean =>
  state === "ok" || state === "stale";
