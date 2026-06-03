import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/config/seo";
import { documentToReactComponents } from "@contentful/rich-text-react-renderer";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";

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

  const description = panel.description?.json
    ? documentToPlainTextString(panel.description.json)
    : panel.source;

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

  const { panelsCollection: panels }: IDataPanelContent = await getContent(
    DATA_PANEL_QUERY,
    { id },
  );

  if (!panels.items.length) {
    notFound();
  }

  const panel = panels.items[0];

  return (
    <HubTemplate>
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex justify-center w-full items-center overflow-hidden">
          <PowerBIContainer panel={panel} pageName={pageName} />
        </div>
      </div>

      {(panel.descriptionTitle || panel.description?.json) && (
        <section className="w-full bg-[#EFEFEF] py-10">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-20 flex flex-col gap-6">
            {panel.descriptionTitle && (
              <h2 className="text-[30px] font-semibold leading-[36px] text-[#292829]">
                {panel.descriptionTitle}
              </h2>
            )}
            {panel.description?.json && (
              <div className="text-base leading-[150%] text-[#292829] whitespace-pre-line">
                {documentToReactComponents(panel.description.json)}
              </div>
            )}
          </div>
        </section>
      )}
    </HubTemplate>
  );
}
