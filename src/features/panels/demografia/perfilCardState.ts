import {
  type PanelCardState,
  type PanelLoadRequest,
  resolveDependentCardStates,
} from "@/features/panels/panelCardState";
import type { TerritorialFilters } from "@/features/panels/territorialFilters";

const PLACE = ["area", "uf", "mun"] as const;

// De quais filtros o dado de cada card depende, pelas consultas de
// `loadDemografiaPanel`: a série traz todos os censos (não segue o ano). O
// mapa desenha os geodados da área toda; o estado e o município destacados
// vêm do filtro pedido (só a tabela `sr-only` do card segue a UF da consulta).
// IMPORTANT: sem "uf" aqui — o zoom do próprio mapa troca a UF, e o mapa não
// pode esmaecer a cada gesto (como no PIB).
const PERFIL_CARD_DEPENDENCIES = {
  bigNumber: ["ano", ...PLACE],
  municipios: ["ano", ...PLACE],
  map: ["ano", "area"],
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
 * mantém a série; trocar o estado ou o município mantém o mapa.
 *
 * @example resolvePerfilCardStates({ failed: false, retrying: false, pending: { ...filters, ano: 2010 } }, filters).serie // "ok"
 */
export const resolvePerfilCardStates = (
  status: PanelLoadRequest<TerritorialFilters>,
  current: TerritorialFilters,
): PerfilCardStates =>
  resolveDependentCardStates(status, current, PERFIL_CARD_DEPENDENCIES);
