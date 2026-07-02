import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import { RelatedPanelsSection } from "@/components/RelatedPanelsSection/RelatedPanelsSection";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
import { getSearchIndex } from "@/features/search/contentful";
import { getRelatedPanelItems } from "@/features/search/relatedPanels";
import Link from "next/link";
import { Icon } from "@/components/Icon/Icon";
import { MACROTHEME_ROUTE_BY_NAME } from "@/features/macrothemes/constants";

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

  const description = getPanelDescriptionText(panel) || panel.source;

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
  const catalogHref = getCatalogHref(panel.macroTheme);

  return (
    <HubTemplate>
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex justify-center w-full items-center overflow-hidden">
          <PowerBIContainer panel={panel} pageName={pageName} />
        </div>
      </div>

      {catalogHref && <CatalogLinkSection href={catalogHref} />}

      <PanelDescriptionSection panel={panel} />

      <RelatedPanelsSection items={relatedPanels} />
    </HubTemplate>
  );
}

const PanelDescriptionSection = ({ panel }: { panel: ReportData }) => {
  if (!panel.descriptionTitle && !panel.description?.json) return null;

  const macroThemeHref = getMacroThemeHref(panel.macroTheme);

  return (
    <section className="w-full bg-[#EFEFEF] py-10">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 sm:px-6 lg:px-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {panel.descriptionTitle && (
            <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
              {panel.descriptionTitle}
            </h2>
          )}
          {macroThemeHref && <MacroThemeLink href={macroThemeHref} />}
        </div>
        {panel.description?.json && (
          <div className="text-base leading-[150%] text-[#292829] [&>p+p]:mt-4">
            {documentToReactComponents(panel.description.json)}
          </div>
        )}
      </div>
    </section>
  );
};

const MacroThemeLink = ({ href }: { href: string }) => (
  <Link
    className="ml-auto inline-flex h-10 shrink-0 items-center justify-center gap-3 rounded-md bg-white px-5 text-sm font-medium leading-6 text-green-900 transition hover:bg-green-neutro"
    href={href}
  >
    Ver mais sobre o tema
    <Icon className="size-2" id="expand" size={9} />
  </Link>
);

const CatalogLinkSection = ({ href }: { href: string }) => (
  <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-2.5 px-4 py-8 sm:px-6 lg:px-20">
    <CatalogLink href={href} />
  </div>
);

const CatalogLink = ({ href }: { href: string }) => (
  <Link
    className="inline-flex h-10 w-full items-center justify-center gap-3 rounded-md bg-green-800 px-5 text-sm font-medium leading-6 text-white transition hover:bg-green-900"
    href={href}
  >
    Acessar o catálogo de dados
    <Icon className="size-4" id="database-search" size={16} />
  </Link>
);

const getCatalogHref = (macroTheme: string): string | null => {
  const slug =
    MACROTHEME_ROUTE_BY_NAME[
      macroTheme as keyof typeof MACROTHEME_ROUTE_BY_NAME
    ];

  return slug ? `/catalog?category=${slug}` : null;
};

const getMacroThemeHref = (macroTheme: string): string | null => {
  const slug =
    MACROTHEME_ROUTE_BY_NAME[
      macroTheme as keyof typeof MACROTHEME_ROUTE_BY_NAME
    ];

  return slug ? `/macrothemes/${slug}` : null;
};

const getPanelDescriptionText = (panel: ReportData): string => {
  if (!panel.description?.json) return "";

  return documentToPlainTextString(panel.description.json);
};
