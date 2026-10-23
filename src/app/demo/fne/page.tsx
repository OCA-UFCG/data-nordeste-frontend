import type { Metadata } from "next";
import { FneDashboard } from "@/components/FneDashboard/FneDashboard";
import { FNE_SOURCE } from "@/components/FneDashboard/FneTexts";
import { FNE_ICON, FNE_TITLE } from "@/components/FneDashboard/fneTheme";
import { PanelPage } from "@/components/Panel/PanelPage";
import { PanelMessage } from "@/components/Panel/PanelShell";
import { buildMetadata } from "@/config/seo";
import {
  parseFneFilters,
  type FneFilters,
} from "@/features/panels/fne/fneFilters";
import { loadFnePanel } from "@/features/panels/fne/fnePanel";
import { queryDataDb } from "@/lib/dataDb";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Painel do FNE (demonstração)",
    description:
      "Protótipo responsivo do painel de contratações do Fundo Constitucional de Financiamento do Nordeste, com mapa em camadas e gráficos nativos.",
    path: "/demo/fne",
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const loadPanel = async (filters: FneFilters) => {
  try {
    return await loadFnePanel(queryDataDb, filters);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "fne_demo_query_failed",
        filters,
        message: error instanceof Error ? error.message : String(error),
      }),
    );

    return null;
  }
};

export default async function FneDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const panel = await loadPanel(parseFneFilters(await searchParams));

  return (
    <HubTemplate>
      {panel ? (
        <FneDashboard data={panel} source={FNE_SOURCE} />
      ) : (
        <PanelPage
          title={FNE_TITLE}
          icon={FNE_ICON}
          tone="green"
          source={FNE_SOURCE}
          summarized={false}
        >
          <PanelMessage>
            Não foi possível consultar o banco de dados. Confira se o túnel para
            o banco do Gamma está ativo e se <code>DATA_DB_URL</code> está
            configurada.
          </PanelMessage>
        </PanelPage>
      )}
    </HubTemplate>
  );
}
