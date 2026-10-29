import type { ReactNode } from "react";
import {
  CatalogLinkSection,
  PanelDescriptionSection,
  PanelIntro,
} from "@/components/Panel/PanelTexts";
import { ReportData } from "@/utils/interfaces";

// Mesmos textos que /data-panel/[id] mostra em volta do Power BI.
// INTENTIONAL: textos prontos, sem consultar o Contentful (cota limitada); por
// isso não há "Conteúdos relacionados", que depende do índice de busca.
export const PanelTextsFrame = ({
  panel,
  children,
}: {
  panel: ReportData;
  children: ReactNode;
}) => (
  <>
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 pt-4 sm:px-6 lg:px-20">
      <PanelIntro panel={panel} collapsible />
    </div>
    {children}
    <CatalogLinkSection macroTheme={panel.macroTheme} />
    <PanelDescriptionSection panel={panel} />
  </>
);
