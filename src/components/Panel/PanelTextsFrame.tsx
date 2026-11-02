import type { ReactNode } from "react";
import { PanelIntro } from "@/components/Panel/PanelIntro";
import {
  CatalogLinkSection,
  PanelDescriptionSection,
} from "@/components/Panel/PanelTexts";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import type { PanelContent } from "@/features/panels/panelContent";

// Mesmos textos e "Conteúdos relacionados" que /data-panel/[id] mostra em volta
// do Power BI.
// INTENTIONAL: sem `content` (Contentful fora do ar ou entrada ausente), só os
// dados do painel aparecem. Os textos são acessórios e não derrubam a página.
export const PanelTextsFrame = ({
  content,
  children,
}: {
  content: PanelContent | null;
  children: ReactNode;
}) => {
  if (!content) return <>{children}</>;

  const { panel, relatedItems } = content;

  return (
    <>
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 pt-4 sm:px-6 lg:px-20">
        <PanelIntro panel={panel} collapsible />
      </div>
      {children}
      <CatalogLinkSection macroTheme={panel.macroTheme} />
      <PanelDescriptionSection panel={panel} />
      <RelatedPanelsSection items={relatedItems} />
    </>
  );
};
