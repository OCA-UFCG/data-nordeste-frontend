import type { Metadata } from "next";
import { AridezDashboard } from "@/components/AridezDashboard/AridezDashboard";
import {
  ARIDEZ_LEAD,
  ARIDEZ_SAIBA_MAIS_PARAGRAPHS,
  ARIDEZ_SAIBA_MAIS_SUMMARY,
  ARIDEZ_SAIBA_MAIS_TITLE,
} from "@/components/AridezDashboard/aridezTexts";
import {
  ARIDEZ_MACROTHEME,
  ARIDEZ_TITLE,
} from "@/components/AridezDashboard/aridezTheme";
import {
  getCatalogHref,
  getMacroThemeHref,
} from "@/components/Panel/texts/PanelTexts";
import { ProtoCover } from "@/components/ProtoPanel/ProtoCover";
import { ProtoSaibaMais } from "@/components/ProtoPanel/ProtoSaibaMais";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import { buildMetadata } from "@/config/seo";
import { loadAridezPanelContent } from "@/features/panels/aridez/aridezContent";
import {
  ARIDEZ_MAX_PLACES,
  ARIDEZ_YEAR_RANGE,
  emptyAridezPanel,
  loadAridezPanel,
} from "@/features/panels/aridez/aridezPanel";
import {
  parseTerritorialFilters,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import { queryDataDb } from "@/lib/dataDb";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Painel de Índice de Aridez (demonstração)",
    description:
      "Protótipo responsivo do painel de Índice de Aridez com gráficos nativos.",
    path: "/demo/aridez",
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Para quem visita: a causa técnica (túnel, DATA_DB_URL) fica no console.error.
const loadPanel = async (filters: TerritorialFilters) => {
  try {
    return await loadAridezPanel(queryDataDb, filters);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "aridez_demo_query_failed",
        filters,
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};

// INTENTIONAL: sem o Contentful, a capa usa o macrotema e o texto de abertura
// padrão e some só a seção de relacionados.
export default async function AridezDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseTerritorialFilters(
    await searchParams,
    ARIDEZ_YEAR_RANGE,
    ARIDEZ_MAX_PLACES,
  );
  const [panel, content] = await Promise.all([
    loadPanel(filters),
    loadAridezPanelContent(),
  ]);
  const macroTheme = content?.panel.macroTheme ?? ARIDEZ_MACROTHEME;

  return (
    <HubTemplate>
      <ProtoCover
        tone="aridez"
        icon="aridez"
        title={ARIDEZ_TITLE}
        lead={content?.panel.abovePanelDescription || ARIDEZ_LEAD}
        macroTheme={macroTheme}
        updatedAt={content?.panel.date}
      />
      <AridezDashboard
        data={panel ?? emptyAridezPanel(filters)}
        failed={!panel}
        catalogHref={getCatalogHref(macroTheme)}
      />
      <ProtoSaibaMais
        tone="aridez"
        title={ARIDEZ_SAIBA_MAIS_TITLE}
        summary={ARIDEZ_SAIBA_MAIS_SUMMARY}
        paragraphs={[...ARIDEZ_SAIBA_MAIS_PARAGRAPHS]}
        themeHref={getMacroThemeHref(macroTheme)}
      />
      {content ? <RelatedPanelsSection items={content.relatedItems} /> : null}
    </HubTemplate>
  );
}
