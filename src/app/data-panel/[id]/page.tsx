import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import { getSearchIndex } from "@/features/search/contentful";
import { getRelatedPanelItems } from "@/features/search/relatedPanels";
import { pickSearchSnippet } from "@/features/seo/searchSnippet";
import {
  CatalogLinkSection,
  getPanelDescriptionText,
  PanelDescriptionSection,
} from "@/components/Panel/PanelTexts";

interface IDataPanelContent {
  panelsCollection: { items: ReportData[] };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { panelsCollection: panels } = await getContent<IDataPanelContent>(
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

  const description = pickSearchSnippet(
    panel.seoDescription,
    getPanelDescriptionText(panel) || panel.source,
  );

  return buildMetadata({
    title: panel.title,
    description: description,
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

  const [content, searchIndex] = await Promise.all([
    getContent<IDataPanelContent>(DATA_PANEL_QUERY, { id }),
    getSearchIndex(),
  ]);
  const panels = content.panelsCollection;

  if (!panels.items.length) {
    notFound();
  }

  const panel = panels.items[0];
  const relatedPanels = getRelatedPanelItems(searchIndex.items, {
    title: panel.title,
    href: `/data-panel/${encodeURIComponent(id)}`,
    macroTheme: panel.macroTheme,
    descriptionTitle: panel.descriptionTitle,
    descriptionText: getPanelDescriptionText(panel),
  });

  return (
    <HubTemplate>
      {/* The panel title is not shown on screen (the embed carries it), but
          screen readers navigate by the page's h1. */}
      <h1 className="sr-only">{panel.title}</h1>
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex justify-center w-full items-center overflow-hidden">
          <PowerBIContainer panel={panel} pageName={pageName} />
        </div>
      </div>

      <CatalogLinkSection macroTheme={panel.macroTheme} />

      <PanelDescriptionSection panel={panel} />

      <RelatedPanelsSection items={relatedPanels} />
    </HubTemplate>
  );
}
