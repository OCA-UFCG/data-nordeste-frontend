import {
  loadDemoPanelContent,
  type PanelContent,
} from "@/features/panels/panelContent";

/** @example await loadPibPanelContent() */
export const loadPibPanelContent = (): Promise<PanelContent | null> =>
  loadDemoPanelContent("pib");
