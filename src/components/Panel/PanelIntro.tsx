import { CollapsibleText } from "@/components/Panel/CollapsibleText";
import { ReportData } from "@/utils/interfaces";

// Cabeçalho do painel (tema, data e texto de abertura), fora de PanelTexts: o
// PowerBiContainer é "use client" e não deve carregar o renderizador de rich text.

const INTRO_TEXT =
  "w-full max-w-[1280px] text-base leading-[150%] text-[#292829]";

/**
 * Tema, data de publicação e texto de abertura do painel, os mesmos na página
 * do Power BI e nas demos nativas. `collapsible`: no celular, o texto mostra
 * 3 linhas e "Ler mais".
 *
 * @example <PanelIntro panel={PIB_PANEL_TEXTS} collapsible />
 */
export const PanelIntro = ({
  panel,
  collapsible = false,
}: {
  panel: ReportData;
  collapsible?: boolean;
}) => {
  const { macroTheme, date, abovePanelDescription } = panel;
  const formattedDate = date ? new Date(date).toLocaleDateString("pt-BR") : "";

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center w-full py-4 sticky left-0">
        <h2 className="text-left font-semibold text-3xl">{macroTheme}</h2>
        <span className="font-medium text-base mt-2 sm:mt-0">
          Publicado em: {formattedDate}
        </span>
      </div>

      {abovePanelDescription &&
        (collapsible ? (
          <CollapsibleText
            text={abovePanelDescription}
            className={INTRO_TEXT}
          />
        ) : (
          <p className={INTRO_TEXT}>{abovePanelDescription}</p>
        ))}
    </>
  );
};
