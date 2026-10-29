import type { Metadata } from "next";
import { PanelPage } from "@/components/Panel/PanelPage";
import { PanelMessage } from "@/components/Panel/PanelShell";
import { PanelTextsFrame } from "@/components/Panel/PanelTextsFrame";
import { PibDashboard } from "@/components/PibDashboard/PibDashboard";
import {
  PIB_ICON,
  PIB_PANEL_TEXTS,
  PIB_SOURCE,
  PIB_TITLE,
} from "@/components/PibDashboard/pibTheme";
import { buildMetadata } from "@/config/seo";
import {
  loadPibPanel,
  PIB_MAX_PLACES,
  PIB_YEAR_RANGE,
} from "@/features/panels/pib/pibPanel";
import {
  buildTerritorialSearch,
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

// Para quem visita: a causa técnica (túnel, DATA_DB_URL) fica no console.error.
// <a>, não <Link>: recarrega a página inteira e refaz a consulta.
const LoadFailedMessage = ({ filters }: { filters: TerritorialFilters }) => (
  <PanelMessage>
    Não foi possível carregar os dados do painel agora. Tente novamente em
    alguns minutos.{" "}
    <a
      href={`/demo/pib${buildTerritorialSearch(filters, PIB_YEAR_RANGE)}`}
      className="font-medium text-green-900 underline underline-offset-4"
    >
      Tentar novamente
    </a>
  </PanelMessage>
);

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
  const panel = await loadPanel(filters);

  return (
    <HubTemplate>
      <PanelTextsFrame panel={PIB_PANEL_TEXTS}>
        {panel ? (
          <PibDashboard data={panel} source={PIB_SOURCE} />
        ) : (
          <PanelPage
            title={PIB_TITLE}
            icon={PIB_ICON}
            tone="orange"
            source={PIB_SOURCE}
          >
            <LoadFailedMessage filters={filters} />
          </PanelPage>
        )}
      </PanelTextsFrame>
    </HubTemplate>
  );
}
