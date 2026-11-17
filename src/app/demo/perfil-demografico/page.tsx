import type { Metadata } from "next";
import { DemografiaDashboard } from "@/components/DemografiaDashboard/DemografiaDashboard";
import {
  DEMOGRAFIA_MACROTHEME,
  DEMOGRAFIA_TITLE,
} from "@/components/DemografiaDashboard/demografiaTheme";
import {
  PERFIL_LEAD,
  PERFIL_SAIBA_MAIS_PARAGRAPHS,
  PERFIL_SAIBA_MAIS_SUMMARY,
  PERFIL_SAIBA_MAIS_TITLE,
} from "@/components/DemografiaDashboard/perfilTexts";
import { ProtoCover } from "@/components/ProtoPanel/ProtoCover";
import { ProtoSaibaMais } from "@/components/ProtoPanel/ProtoSaibaMais";
import {
  getCatalogHref,
  getMacroThemeHref,
} from "@/components/Panel/texts/PanelTexts";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import { buildMetadata } from "@/config/seo";
import { loadDemografiaPanelContent } from "@/features/panels/demografia/demografiaContent";
import {
  DEMOGRAFIA_MAX_PLACES,
  DEMOGRAFIA_YEAR_RANGE,
  emptyDemografiaPanel,
  loadDemografiaPanel,
} from "@/features/panels/demografia/demografiaPanel";
import {
  parseTerritorialFilters,
  type TerritorialFilters,
} from "@/features/panels/territorialFilters";
import { queryDataDb } from "@/lib/dataDb";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Painel de Perfil Demográfico (demonstração)",
    description:
      "Protótipo responsivo do painel de perfil demográfico com gráficos nativos.",
    path: "/demo/perfil-demografico",
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const loadPanel = async (filters: TerritorialFilters) => {
  try {
    return await loadDemografiaPanel(queryDataDb, filters);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "demografia_demo_query_failed",
        filters,
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};

// Mesmo layout do IDH: capa, painel, "Saiba mais" e relacionados. Sem o banco,
// os cards mostram o erro com "Tentar de novo" em vez de derrubar a página.
// INTENTIONAL: sem o Contentful, a capa usa o macrotema padrão e some só a
// seção de relacionados.
export default async function PerfilDemograficoDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseTerritorialFilters(
    await searchParams,
    DEMOGRAFIA_YEAR_RANGE,
    DEMOGRAFIA_MAX_PLACES,
  );
  const [panel, content] = await Promise.all([
    loadPanel(filters),
    loadDemografiaPanelContent(),
  ]);
  const macroTheme = content?.panel.macroTheme ?? DEMOGRAFIA_MACROTHEME;

  return (
    <HubTemplate>
      <ProtoCover
        tone="perfil"
        icon="users"
        title={DEMOGRAFIA_TITLE}
        lead={PERFIL_LEAD}
        macroTheme={macroTheme}
        publishedAt={content?.panel.date}
      />
      <DemografiaDashboard
        data={panel ?? emptyDemografiaPanel(filters)}
        failed={!panel}
        catalogHref={getCatalogHref(macroTheme)}
      />
      <ProtoSaibaMais
        tone="perfil"
        title={PERFIL_SAIBA_MAIS_TITLE}
        summary={PERFIL_SAIBA_MAIS_SUMMARY}
        paragraphs={[...PERFIL_SAIBA_MAIS_PARAGRAPHS]}
        themeHref={getMacroThemeHref(macroTheme)}
      />
      {content ? <RelatedPanelsSection items={content.relatedItems} /> : null}
    </HubTemplate>
  );
}
