import {
  loadDemoPanelContent,
  type PanelContent,
} from "@/features/panels/panelContent";

/** @example await loadFnePanelContent() */
export const loadFnePanelContent = (): Promise<PanelContent | null> =>
  loadDemoPanelContent("fundo_financiamento");
