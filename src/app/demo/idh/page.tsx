import type { Metadata } from "next";
import { IdhDashboard } from "@/components/IdhDashboard/IdhDashboard";
import {
  IDH_SAIBA_MAIS_GLOSSARY,
  IDH_SAIBA_MAIS_PARAGRAPHS,
  IDH_SAIBA_MAIS_SUMMARY,
  IDH_SAIBA_MAIS_TITLE,
} from "@/components/IdhDashboard/idhSaibaMaisTexts";
import {
  IDH_LEAD,
  IDH_MACROTHEME,
  IDH_TITLE,
} from "@/components/IdhDashboard/idhTheme";
import { ProtoCover } from "@/components/ProtoPanel/ProtoCover";
import { ProtoSaibaMais } from "@/components/ProtoPanel/ProtoSaibaMais";
import {
  getCatalogHref,
  getMacroThemeHref,
  PanelDescriptionSection,
} from "@/components/Panel/texts/PanelTexts";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import { buildMetadata } from "@/config/seo";
import { loadIdhPanelContent } from "@/features/panels/idh/idhContent";
import {
  emptyIdhPanel,
  loadIdhPanel,
  parseIdhFilters,
  type IdhFilters,
} from "@/features/panels/idh/idhPanel";
import { formatIdhUpdatedAt } from "@/features/panels/idh/idhUpdatedAt";
import {
  NO_IDH_YEARS,
  tryLoadIdhYearRange,
} from "@/features/panels/idh/idhYearRange";
import type { YearRange } from "@/features/panels/territorialFilters";
import { queryDataDb } from "@/lib/dataDb";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Painel de IDH (demonstração)",
    description:
      "Protótipo responsivo do painel de Índice de Desenvolvimento Humano com gráficos nativos.",
    path: "/demo/idh",
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const loadPanel = async (filters: IdhFilters, range: YearRange) => {
  try {
    return await loadIdhPanel(queryDataDb, filters, range);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "idh_demo_query_failed",
        filters,
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};

// Layout do protótipo dos painéis: capa, painel, descrição do Contentful,
// "Saiba mais" e relacionados.
// INTENTIONAL: sem o Contentful, a capa usa o macrotema e o texto de abertura
// do IDH e somem a descrição e os relacionados; sem o banco, os cards mostram o
// erro com "Tentar de novo" em vez de derrubar a página, também quando só o
// intervalo de anos falha (então não há ano a oferecer).
// IMPORTANT: o título fica constante. O `title` da entrada "panels" é a chave
// da consulta ("idh"), não um texto para exibir (ver `createPanelEntryReader`).
export default async function IdhDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const range = await tryLoadIdhYearRange(queryDataDb);
  const years = range ?? NO_IDH_YEARS;
  const filters = parseIdhFilters(await searchParams, years);
  const [panel, content] = await Promise.all([
    range ? loadPanel(filters, range) : null,
    loadIdhPanelContent(),
  ]);
  const macroTheme = content?.panel.macroTheme ?? IDH_MACROTHEME;

  return (
    <HubTemplate>
      <ProtoCover
        tone="idh"
        icon="idh"
        title={IDH_TITLE}
        lead={content?.panel.abovePanelDescription || IDH_LEAD}
        macroTheme={macroTheme}
        publishedAt={content?.panel.date}
      />
      <IdhDashboard
        data={panel ?? emptyIdhPanel(filters, years)}
        failed={!panel}
        updatedAt={formatIdhUpdatedAt(content?.panel.date)}
        catalogHref={getCatalogHref(macroTheme)}
      />
      {content ? <PanelDescriptionSection panel={content.panel} /> : null}
      <ProtoSaibaMais
        tone="idh"
        title={IDH_SAIBA_MAIS_TITLE}
        summary={IDH_SAIBA_MAIS_SUMMARY}
        paragraphs={[...IDH_SAIBA_MAIS_PARAGRAPHS]}
        glossary={IDH_SAIBA_MAIS_GLOSSARY}
        themeHref={getMacroThemeHref(macroTheme)}
      />
      {content ? <RelatedPanelsSection items={content.relatedItems} /> : null}
    </HubTemplate>
  );
}
