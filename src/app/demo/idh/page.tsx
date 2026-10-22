import type { Metadata } from "next";
import { IdhDashboard } from "@/components/IdhDashboard/IdhDashboard";
import { IDH_ICON, IDH_TITLE } from "@/components/IdhDashboard/idhTheme";
import { PanelPage } from "@/components/Panel/PanelPage";
import { PanelMessage } from "@/components/Panel/PanelShell";
import { buildMetadata } from "@/config/seo";
import {
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

const SOURCE =
  "Fonte dos dados: Atlas do Desenvolvimento Humano no Brasil (PNUD, Ipea e Fundação João Pinheiro), com base na PNAD Contínua do IBGE. Sem estado selecionado, os valores são a média simples dos estados (ou regiões metropolitanas) do Nordeste. Consultado ao vivo no banco do Data Nordeste.";

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

export default async function IdhDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const panel = await loadPanel(parseIdhFilters(await searchParams));

  // A key remonta as abas quando um link muda ?visao= sem trocar de página.

  return (
    <HubTemplate>
      {panel ? (
        <IdhDashboard key={panel.filters.visao} data={panel} source={SOURCE} />
      ) : (
        <PanelPage
          title={IDH_TITLE}
          icon={IDH_ICON}
          tone="orange"
          source={SOURCE}
        >
          <PanelMessage>
            Não foi possível consultar o banco de dados. Confira se o túnel para
            o banco está ativo e se <code>DATA_DB_URL</code> está configurada.
          </PanelMessage>
        </PanelPage>
      )}
    </HubTemplate>
  );
}
