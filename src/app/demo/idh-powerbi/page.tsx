import type { Metadata } from "next";
import { IdhDashboard } from "@/components/IdhPowerBiDashboard/IdhDashboard";
import {
  IDH_ICON,
  IDH_SOURCE,
  IDH_TITLE,
} from "@/components/IdhPowerBiDashboard/idhTheme";
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
import {
  NO_IDH_YEARS,
  tryLoadIdhYearRange,
} from "@/features/panels/idh/idhYearRange";
import type { YearRange } from "@/features/panels/territorialFilters";
import { queryDataDb } from "@/lib/dataDb";
import HubTemplate from "@/templates/HubTemplate";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Painel de IDH no padrão Power BI (demonstração)",
    description:
      "Protótipo responsivo do painel de Índice de Desenvolvimento Humano com gráficos nativos.",
    path: "/demo/idh-powerbi",
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const loadPanel = async (filters: IdhFilters, range: YearRange) => {
  try {
    return await loadIdhPanel(queryDataDb, filters, range);
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

const LoadFailedMessage = ({ retryHref }: { retryHref: string }) => (
  <PanelMessage>
    Não foi possível carregar os dados do painel agora. Tente novamente em
    alguns minutos.{" "}
    <a
      href={retryHref}
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
  const range = await tryLoadIdhYearRange(queryDataDb);
  const years = range ?? NO_IDH_YEARS;
  const filters = parseIdhFilters(await searchParams, years);
  const [panel, content] = await Promise.all([
    range ? loadPanel(filters, range) : null,
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
            tone="idh"
            source={IDH_SOURCE}
            fullMobile
          >
            <LoadFailedMessage
              retryHref={`/demo/idh-powerbi${buildIdhSearch(filters, years)}`}
            />
          </PanelPage>
        )}
      </PanelTextsFrame>
    </HubTemplate>
  );
}
