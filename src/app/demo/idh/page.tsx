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

const loadPanel = async (filters: IdhFilters) => {
  try {
    return await loadIdhPanel(queryDataDb, filters);
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

// Layout do protótipo dos painéis: capa, painel, "Saiba mais" e relacionados.
// INTENTIONAL: sem o Contentful, a capa usa o macrotema do IDH e some só a
// seção de relacionados; sem o banco, os cards mostram o erro com "Tentar de
// novo" em vez de derrubar a página.
export default async function IdhDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseIdhFilters(await searchParams);
  const [panel, content] = await Promise.all([
    loadPanel(filters),
    loadIdhPanelContent(),
  ]);
  const macroTheme = content?.panel.macroTheme ?? IDH_MACROTHEME;

  // A key remonta as abas quando um link muda ?visao= sem trocar de página.

  return (
    <HubTemplate>
      <ProtoCover
        tone="idh"
        icon="idh"
        title={IDH_TITLE}
        lead={IDH_LEAD}
        macroTheme={macroTheme}
        publishedAt={content?.panel.date}
      />
      <IdhDashboard
        key={filters.visao}
        data={panel ?? emptyIdhPanel(filters)}
        failed={!panel}
        catalogHref={getCatalogHref(macroTheme)}
      />
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
