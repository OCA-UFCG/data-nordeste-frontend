import {
  type PanelCardState,
  type PanelLoadRequest,
  resolveDependentCardStates,
} from "@/features/panels/panelCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

const PLACE = ["area", "uf", "mun"] as const;

// De quais filtros o dado de cada card depende, pelas consultas de
// `loadDemografiaPanel`: a série traz todos os censos (não segue o ano) e o
// mapa traz a área toda (`byMunicipality: false`, não segue o município). Os
// estados destacados no mapa vêm do filtro pedido, então não esmaecem o mapa.
const PERFIL_CARD_DEPENDENCIES = {
  bigNumber: ["ano", ...PLACE],
  municipios: ["ano", ...PLACE],
  map: ["ano", "area", "uf"],
  sexo: ["ano", ...PLACE],
  piramide: ["ano", ...PLACE],
  serie: [...PLACE],
  corRaca: ["ano", ...PLACE],
} as const satisfies Record<string, readonly (keyof TerritorialFilters)[]>;

export type PerfilCardKey = keyof typeof PERFIL_CARD_DEPENDENCIES;

export type PerfilCardStates = Record<PerfilCardKey, PanelCardState>;

/**
 * Estado de cada card do perfil enquanto um filtro carrega: só esmaece o card
 * cujo dado muda, como no IDH e no PIB (revisão da PR #400). Trocar o ano
 * mantém a série; trocar o município mantém o mapa.
 *
 * @example resolvePerfilCardStates({ failed: false, retrying: false, pending: { ...filters, ano: 2010 } }, filters).serie // "ok"
 */
export const resolvePerfilCardStates = (
  status: PanelLoadRequest<TerritorialFilters>,
  current: TerritorialFilters,
): PerfilCardStates =>
  resolveDependentCardStates(status, current, PERFIL_CARD_DEPENDENCIES);
