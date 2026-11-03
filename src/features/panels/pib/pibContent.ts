import {
  loadPanelContent,
  type PanelContent,
} from "@/features/panels/panelContent";

const PIB_PANEL_ID = "pib";

// O href da página do Power BI: assim o próprio painel não entra nos relacionados.
const PIB_PANEL_HREF = `/data-panel/${PIB_PANEL_ID}`;

/**
 * Textos e relacionados do painel de PIB. Falha do Contentful (erro ou entrada
 * ausente) vira null e um console.error: os dados do banco continuam na tela.
 *
 * @example await loadPibPanelContent()
 */
export const loadPibPanelContent = async (): Promise<PanelContent | null> => {
  try {
    const content = await loadPanelContent(PIB_PANEL_ID, PIB_PANEL_HREF);

    if (content) return content;

    throw new Error(
      `Contentful has no "panels" entry titled "${PIB_PANEL_ID}"; expected one entry with the PIB panel texts.`,
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "pib_demo_content_failed",
        id: PIB_PANEL_ID,
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};
