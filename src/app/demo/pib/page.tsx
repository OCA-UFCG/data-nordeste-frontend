import type { Metadata } from "next";
import { PanelPage } from "@/components/Panel/PanelPage";
import { PanelMessage } from "@/components/Panel/PanelShell";
import { PanelTextsFrame } from "@/components/Panel/PanelTextsFrame";
import { PibDashboard } from "@/components/PibDashboard/PibDashboard";
import {
  PIB_ICON,
  PIB_PANEL_TEXTS,
  PIB_TITLE,
} from "@/components/PibDashboard/pibTheme";
import { buildMetadata } from "@/config/seo";
import {
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

// Texto do rodapé do Power BI, sem alterações.
const SOURCE =
  "Fonte dos dados: Instituto Brasileiro de Geografia e Estatística (IBGE) e Secretaria do Tesouro Nacional (STN) Finanças do Brasil (FINBRA) e Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (SICONFI).";

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
          <PibDashboard data={panel} source={SOURCE} />
        ) : (
          <PanelPage
            title={PIB_TITLE}
            icon={PIB_ICON}
            tone="orange"
            source={SOURCE}
          >
            <PanelMessage>
              Não foi possível consultar o banco de dados. Confira se o túnel
              para o banco está ativo e se <code>DATA_DB_URL</code> está
              configurada.
            </PanelMessage>
          </PanelPage>
        )}
      </PanelTextsFrame>
    </HubTemplate>
  );
}
