import {
  type PanelCardState,
  type PanelLoadRequest,
  resolveDependentCardStates,
} from "@/features/panels/panelCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

// De quais filtros o dado de cada card depende (as consultas de
// `loadAridezPanel`). Como no PIB, o mapa usa os municípios da área inteira
// (`data.mapa`) e ignora Estado e Município: o zoom ou o clique não o esmaece
// nem o desmonta. Só erro e nova tentativa o trocam pelo esqueleto.
const ARIDEZ_CARD_DEPENDENCIES = {
  bigNumbers: ["area", "uf", "mun", "ano"],
  map: ["area", "ano"],
  classes: ["area", "uf", "mun", "ano"],
  municipios: ["area", "uf", "mun", "ano"],
} as const satisfies Record<string, readonly (keyof TerritorialFilters)[]>;

type AridezCardKey = keyof typeof ARIDEZ_CARD_DEPENDENCIES;

export type AridezCardStates = Record<AridezCardKey, PanelCardState>;

/**
 * Estado de cada card do painel de aridez enquanto um filtro carrega: só o
 * card cujo dado muda fica esmaecido.
 *
 * @example resolveAridezCardStates({ failed: false, retrying: false, pending: { ...filters, uf: ["PE"] } }, filters).map // "ok"
 */
export const resolveAridezCardStates = (
  status: PanelLoadRequest<TerritorialFilters>,
  current: TerritorialFilters,
): AridezCardStates =>
  resolveDependentCardStates(status, current, ARIDEZ_CARD_DEPENDENCIES);
