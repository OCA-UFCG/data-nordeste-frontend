import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";

interface IDataPanelContent {
  panelsCollection: { items: ReportData[] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { panelsCollection: panels }: IDataPanelContent = await getContent(
    DATA_PANEL_QUERY,
    { id },
  );
  const panel = panels.items[0];

  if (!panel) {
    return buildMetadata({
      title: "Painel de dados",
      path: `/data-panel/${id}`,
    });
  }

  return buildMetadata({
    title: panel.title,
    description: panel.description || panel.source,
    path: `/data-panel/${id}`,
  });
}

export default async function DataPanel({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pageName?: string }>;
}) {
  const [{ id }, { pageName }] = await Promise.all([params, searchParams]);

  const { panelsCollection: panels }: IDataPanelContent = await getContent(
    DATA_PANEL_QUERY,
    { id },
  );

  if (!panels.items.length) {
    notFound();
  }

  return (
    <HubTemplate>
      <div className="flex justify-center h-full w-full items-center overflow-hidden">
        <PowerBIContainer panel={panels.items[0]} pageName={pageName} />
      </div>
    </HubTemplate>
  );
}
