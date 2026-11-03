import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import {
  getPanelEntry,
  loadPanelContent,
} from "@/features/panels/panelContent";
import { pickSearchSnippet } from "@/features/seo/searchSnippet";
import {
  CatalogLinkSection,
  getPanelDescriptionText,
  PanelDescriptionSection,
} from "@/components/Panel/texts/PanelTexts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const panel = await getPanelEntry(id);

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
  const content = await loadPanelContent(
    id,
    `/data-panel/${encodeURIComponent(id)}`,
  );

  if (!content) {
    notFound();
  }

  const { panel, relatedItems } = content;

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

      <RelatedPanelsSection items={relatedItems} />
    </HubTemplate>
  );
}
