import type { ReactNode } from "react";
import { getMacroThemeHref } from "@/components/Panel/texts/PanelTexts";
import {
  PIB_LEAD,
  PIB_SAIBA_MAIS_GLOSSARY,
  PIB_SAIBA_MAIS_PARAGRAPHS,
  PIB_SAIBA_MAIS_SUMMARY,
  PIB_SAIBA_MAIS_TITLE,
} from "@/components/PibDashboard/pibTexts";
import { PIB_ICON, PIB_TITLE } from "@/components/PibDashboard/pibTheme";
import { ProtoCover } from "@/components/ProtoPanel/ProtoCover";
import { ProtoSaibaMais } from "@/components/ProtoPanel/ProtoSaibaMais";

/**
 * Capa e "Saiba mais" da página do PIB em volta do painel. A página e o
 * `loading.tsx` usam a mesma moldura, para nada mudar quando os dados chegam.
 *
 * @example <PibPageFrame macroTheme="Economia e Renda" publishedAt="2025-05-14"><PibDashboard … /></PibPageFrame>
 */
export const PibPageFrame = ({
  macroTheme,
  publishedAt,
  children,
}: {
  macroTheme: string;
  publishedAt?: string;
  children: ReactNode;
}) => (
  <>
    <ProtoCover
      tone="pib"
      light
      icon={PIB_ICON}
      title={PIB_TITLE}
      lead={PIB_LEAD}
      macroTheme={macroTheme}
      publishedAt={publishedAt}
    />
    {children}
    <ProtoSaibaMais
      tone="pib"
      title={PIB_SAIBA_MAIS_TITLE}
      summary={PIB_SAIBA_MAIS_SUMMARY}
      paragraphs={[...PIB_SAIBA_MAIS_PARAGRAPHS]}
      glossary={PIB_SAIBA_MAIS_GLOSSARY}
      themeHref={getMacroThemeHref(macroTheme)}
    />
  </>
);
