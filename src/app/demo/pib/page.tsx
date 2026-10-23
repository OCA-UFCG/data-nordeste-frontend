import type { Metadata } from "next";
import { CircleDollarSign } from "lucide-react";
import { PanelMessage, PanelShell } from "@/components/Panel/PanelShell";
import { PibDashboard } from "@/components/PibDashboard/PibDashboard";
import { buildMetadata } from "@/config/seo";
import { loadPibPanel, PIB_YEAR_RANGE } from "@/features/panels/pib/pibPanel";
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

const SOURCE =
  "Fonte dos dados: Instituto Brasileiro de Geografia e Estatística (IBGE), Secretaria do Tesouro Nacional (STN) Finanças do Brasil (FINBRA) e Sistema de Informações Contábeis e Fiscais do Setor Público Brasileiro (SICONFI). Consultado ao vivo no banco do Data Nordeste.";

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
  const filters = parseTerritorialFilters(await searchParams, PIB_YEAR_RANGE);
  const panel = await loadPanel(filters);

  return (
    <HubTemplate>
      <PanelShell
        theme="Painel de Economia e Renda"
        icon={CircleDollarSign}
        source={SOURCE}
      >
        {panel ? (
          <PibDashboard data={panel} />
        ) : (
          <PanelMessage>
            Não foi possível consultar o banco de dados. Confira se o túnel para
            o banco está ativo e se <code>DATA_DB_URL</code> está configurada.
          </PanelMessage>
        )}
      </PanelShell>
    </HubTemplate>
  );
}
