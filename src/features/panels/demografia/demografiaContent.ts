import {
  loadDemoPanelContent,
  type PanelContent,
} from "@/features/panels/panelContent";

/** @example await loadDemografiaPanelContent() */
export const loadDemografiaPanelContent = (): Promise<PanelContent | null> =>
  loadDemoPanelContent("populacao");
