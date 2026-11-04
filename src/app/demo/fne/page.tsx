import type { Metadata } from "next";
import { FneDashboard } from "@/components/FneDashboard/FneDashboard";
import { FNE_SOURCE } from "@/components/FneDashboard/FneTexts";
import { FNE_ICON, FNE_TITLE } from "@/components/FneDashboard/fneTheme";
import { PanelPage } from "@/components/Panel/layout/PanelPage";
import { PanelMessage } from "@/components/Panel/layout/PanelShell";
import { PanelTextsFrame } from "@/components/Panel/texts/PanelTextsFrame";
import { buildMetadata } from "@/config/seo";
import { loadFnePanelContent } from "@/features/panels/fne/fneContent";
import {
  buildFneSearch,
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

const LoadFailedMessage = ({ filters }: { filters: FneFilters }) => (
  <PanelMessage>
    Não foi possível carregar os dados do painel agora. Tente novamente em
    alguns minutos.{" "}
    <a
      href={`/demo/fne${buildFneSearch(filters)}`}
      className="font-medium text-green-900 underline underline-offset-4"
    >
      Tentar novamente
    </a>
  </PanelMessage>
);

export default async function FneDemoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFneFilters(await searchParams);
  const [panel, content] = await Promise.all([
    loadPanel(filters),
    loadFnePanelContent(),
  ]);

  return (
    <HubTemplate>
      <PanelTextsFrame content={content}>
        {panel ? (
          <FneDashboard data={panel} source={FNE_SOURCE} />
        ) : (
          <PanelPage
            title={FNE_TITLE}
            icon={FNE_ICON}
            tone="green"
            source={FNE_SOURCE}
            fullMobile
          >
            <LoadFailedMessage filters={filters} />
          </PanelPage>
        )}
      </PanelTextsFrame>
    </HubTemplate>
  );
}
