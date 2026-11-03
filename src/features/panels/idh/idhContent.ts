import {
  loadDemoPanelContent,
  type PanelContent,
} from "@/features/panels/panelContent";

/** @example await loadIdhPanelContent() */
export const loadIdhPanelContent = (): Promise<PanelContent | null> =>
  loadDemoPanelContent("idh");
