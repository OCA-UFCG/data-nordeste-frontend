import {
  type PanelCardState,
  type PanelLoadRequest,
  resolveDependentCardStates,
} from "@/features/panels/panelCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

// De quais filtros o dado de cada card depende (as consultas de
// `loadPibPanel`). O ano escolhido na série e os estados destacados no mapa
// vêm do filtro pedido (seleção otimista), então não contam. O mapa desenha
// os geodados da área inteira e ignora Estado e Município: o zoom ou o clique
// num estado não o esmaece.
const PIB_CARD_DEPENDENCIES = {
  bigNumbers: ["area", "uf", "mun", "ano"],
  evolution: ["area", "uf", "mun"],
  map: ["area", "ano"],
  sectors: ["area", "uf", "mun", "ano"],
} as const satisfies Record<string, readonly (keyof TerritorialFilters)[]>;

export type PibCardKey = keyof typeof PIB_CARD_DEPENDENCIES;

export type PibCardStates = Record<PibCardKey, PanelCardState>;

/**
 * Estado de cada card do painel do PIB enquanto um filtro carrega: só o card
 * cujo dado muda fica esmaecido; nenhum vira esqueleto, salvo depois de uma
 * consulta falhada.
 *
 * @example resolvePibCardStates({ failed: false, retrying: false, pending: { ...filters, uf: ["PE"] } }, filters).map // "ok"
 */
export const resolvePibCardStates = (
  status: PanelLoadRequest<TerritorialFilters>,
  current: TerritorialFilters,
): PibCardStates =>
  resolveDependentCardStates(status, current, PIB_CARD_DEPENDENCIES);
