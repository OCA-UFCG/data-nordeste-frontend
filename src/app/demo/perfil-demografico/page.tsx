import type { Metadata } from "next";
import { DemografiaDashboard } from "@/components/DemografiaDashboard/DemografiaDashboard";
import {
  DEMOGRAFIA_ICON,
  DEMOGRAFIA_TITLE,
} from "@/components/DemografiaDashboard/demografiaTheme";
import { PanelPage } from "@/components/Panel/PanelPage";
import { PanelMessage } from "@/components/Panel/PanelShell";
import { buildMetadata } from "@/config/seo";
import {
  DEMOGRAFIA_YEAR_RANGE,
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

const SOURCE =
  "Fonte dos dados: Instituto Brasileiro de Geografia e Estatística (IBGE), Censos Demográficos de 2000, 2010 e 2022. A população por cor ou raça soma apenas quem declarou. Consultado ao vivo no banco do Data Nordeste.";

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

export default async function PerfilDemograficoDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseTerritorialFilters(
    await searchParams,
    DEMOGRAFIA_YEAR_RANGE,
  );
  const panel = await loadPanel(filters);

  return (
    <HubTemplate>
      {panel ? (
        <DemografiaDashboard data={panel} source={SOURCE} />
      ) : (
        <PanelPage
          title={DEMOGRAFIA_TITLE}
          icon={DEMOGRAFIA_ICON}
          tone="pink"
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
