import type { Metadata } from "next";
import {
  getCatalogHref,
  getMacroThemeHref,
} from "@/components/Panel/texts/PanelTexts";
import { PibDashboard } from "@/components/PibDashboard/PibDashboard";
import {
  PIB_LEAD,
  PIB_SAIBA_MAIS_GLOSSARY,
  PIB_SAIBA_MAIS_PARAGRAPHS,
  PIB_SAIBA_MAIS_SUMMARY,
  PIB_SAIBA_MAIS_TITLE,
} from "@/components/PibDashboard/pibTexts";
import { PIB_MACROTHEME, PIB_TITLE } from "@/components/PibDashboard/pibTheme";
import { ProtoCover } from "@/components/ProtoPanel/ProtoCover";
import { ProtoSaibaMais } from "@/components/ProtoPanel/ProtoSaibaMais";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import { buildMetadata } from "@/config/seo";
import { loadPibPanelContent } from "@/features/panels/pib/pibContent";
import {
  emptyPibPanel,
  loadPibPanel,
  PIB_MAX_PLACES,
  PIB_YEAR_RANGE,
} from "@/features/panels/pib/pibPanel";
import {
  parseTerritorialFilters,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import { queryDataDb } from "@/lib/dataDb";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Painel de PIB (demonstração)",
    description:
      "Protótipo responsivo do painel de Produto Interno Bruto com gráficos nativos.",
    path: "/demo/pib",
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Para quem visita: a causa técnica (túnel, DATA_DB_URL) fica no console.error.
const loadPanel = async (filters: TerritorialFilters) => {
  try {
    return await loadPibPanel(queryDataDb, filters);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "pib_demo_query_failed",
        filters,
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};

// Mesmo layout do IDH e do perfil: capa, painel, "Saiba mais" e relacionados.
// Sem o banco, os cards mostram o erro com "Tentar de novo" em vez de derrubar
// a página.
// INTENTIONAL: sem o Contentful, a capa usa o macrotema padrão e some só a
// seção de relacionados.
export default async function PibDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseTerritorialFilters(
    await searchParams,
    PIB_YEAR_RANGE,
    PIB_MAX_PLACES,
  );
  const [panel, content] = await Promise.all([
    loadPanel(filters),
    loadPibPanelContent(),
  ]);
  const macroTheme = content?.panel.macroTheme ?? PIB_MACROTHEME;

  return (
    <HubTemplate>
      <ProtoCover
        tone="pib"
        icon="usd"
        title={PIB_TITLE}
        lead={PIB_LEAD}
        macroTheme={macroTheme}
        publishedAt={content?.panel.date}
      />
      <PibDashboard
        data={panel ?? emptyPibPanel(filters)}
        failed={!panel}
        catalogHref={getCatalogHref(macroTheme)}
      />
      <ProtoSaibaMais
        tone="pib"
        title={PIB_SAIBA_MAIS_TITLE}
        summary={PIB_SAIBA_MAIS_SUMMARY}
        paragraphs={[...PIB_SAIBA_MAIS_PARAGRAPHS]}
        glossary={PIB_SAIBA_MAIS_GLOSSARY}
        themeHref={getMacroThemeHref(macroTheme)}
      />
      {content ? <RelatedPanelsSection items={content.relatedItems} /> : null}
    </HubTemplate>
  );
}
