import type { Metadata } from "next";
import { DemografiaDashboard } from "@/components/DemografiaDashboard/DemografiaDashboard";
import {
  DEMOGRAFIA_ICON,
  DEMOGRAFIA_SOURCE,
  DEMOGRAFIA_TITLE,
} from "@/components/DemografiaDashboard/demografiaTheme";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { PanelMessage } from "@/components/Panel/layout/PanelShell";
import { PanelTextsFrame } from "@/components/Panel/texts/PanelTextsFrame";
import { buildMetadata } from "@/config/seo";
import { loadDemografiaPanelContent } from "@/features/panels/demografia/demografiaContent";
import {
  DEMOGRAFIA_MAX_PLACES,
  DEMOGRAFIA_YEAR_RANGE,
  loadDemografiaPanel,
} from "@/features/panels/demografia/demografiaPanel";
import {
  buildTerritorialSearch,
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

const LoadFailedMessage = ({ filters }: { filters: TerritorialFilters }) => (
  <PanelMessage>
    Não foi possível carregar os dados do painel agora. Tente novamente em
    alguns minutos.{" "}
    <a
      href={`/demo/perfil-demografico${buildTerritorialSearch(filters, DEMOGRAFIA_YEAR_RANGE)}`}
      className="font-medium text-green-900 underline underline-offset-4"
    >
      Tentar novamente
    </a>
  </PanelMessage>
);

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

  return (
    <HubTemplate>
      <PanelTextsFrame content={content}>
        {panel ? (
          <DemografiaDashboard data={panel} source={DEMOGRAFIA_SOURCE} />
        ) : (
          <PanelPage
            title={DEMOGRAFIA_TITLE}
            icon={DEMOGRAFIA_ICON}
            tone="pink"
            source={DEMOGRAFIA_SOURCE}
            fullMobile
          >
            <LoadFailedMessage filters={filters} />
          </PanelPage>
        )}
      </PanelTextsFrame>
    </HubTemplate>
  );
}
