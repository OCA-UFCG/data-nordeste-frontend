import type { Metadata } from "next";
import { IdhDashboard } from "@/components/IdhDashboard/IdhDashboard";
import {
  IDH_ICON,
  IDH_SOURCE,
  IDH_TITLE,
} from "@/components/IdhDashboard/idhTheme";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { PanelMessage } from "@/components/Panel/layout/PanelShell";
import { PanelTextsFrame } from "@/components/Panel/texts/PanelTextsFrame";
import { buildMetadata } from "@/config/seo";
import { loadIdhPanelContent } from "@/features/panels/idh/idhContent";
import {
  buildIdhSearch,
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

// Para quem visita: a causa técnica (túnel, DATA_DB_URL) fica no console.error.
// <a>, não <Link>: recarrega a página inteira e refaz a consulta.
const LoadFailedMessage = ({ filters }: { filters: IdhFilters }) => (
  <PanelMessage>
    Não foi possível carregar os dados do painel agora. Tente novamente em
    alguns minutos.{" "}
    <a
      href={`/demo/idh${buildIdhSearch(filters)}`}
      className="font-medium text-green-900 underline underline-offset-4"
    >
      Tentar novamente
    </a>
  </PanelMessage>
);

export default async function IdhDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseIdhFilters(await searchParams);
  const [panel, content] = await Promise.all([
    loadPanel(filters),
    loadIdhPanelContent(),
  ]);

  // A key remonta as abas quando um link muda ?visao= sem trocar de página.

  return (
    <HubTemplate>
      <PanelTextsFrame content={content}>
        {panel ? (
          <IdhDashboard
            key={panel.filters.visao}
            data={panel}
            source={IDH_SOURCE}
          />
        ) : (
          <PanelPage
            title={IDH_TITLE}
            icon={IDH_ICON}
            tone="orange"
            source={IDH_SOURCE}
            fullMobile
          >
            <LoadFailedMessage filters={filters} />
          </PanelPage>
        )}
      </PanelTextsFrame>
    </HubTemplate>
  );
}
