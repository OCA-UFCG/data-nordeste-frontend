import {
  loadDemoPanelContent,
  type PanelContent,
} from "@/features/panels/panelContent";

/**
 * Textos do Contentful do painel de aridez: a entrada "panels" `aridez`
 * ("Índice de aridez"), a mesma da página do Power BI.
 *
 * @example await loadAridezPanelContent()
 */
export const loadAridezPanelContent = (): Promise<PanelContent | null> =>
  loadDemoPanelContent("aridez");
