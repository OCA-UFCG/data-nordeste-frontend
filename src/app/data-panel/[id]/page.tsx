// import AnchorSection from "@/components/AnchorSection/AnchorSection";
import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { REVALIDATE } from "@/utils/constants";
import { getContent } from "@/utils/contentful";
import { IPageHeader, ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";

export const revalidate = REVALIDATE;

interface IDataPanelContent {
  panelsCollection: { items: ReportData[] };
  pageHeadersCollection: { items: IPageHeader[] };
}

type DataPanelParams = { id?: string };
type DataPanelSearchParams = { pageName?: string };

export default async function DataPanel({
  params,
  searchParams,
}: {
  params: DataPanelParams | Promise<DataPanelParams>;
  searchParams: DataPanelSearchParams | Promise<DataPanelSearchParams>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;

  if (!id) {
    notFound();
  }

  const {
    panelsCollection: panels,

    // pageHeadersCollection: pageHeaders,
  }: IDataPanelContent = await getContent(DATA_PANEL_QUERY, { id });

  if (!panels.items.length) {
    notFound();
  }

  return (
    <HubTemplate>
      <div className="flex justify-center h-full w-full items-center overflow-hidden">
        <PowerBIContainer
          panel={panels.items[0]}
          pageName={resolvedSearchParams.pageName}
        />
      </div>
      {/* <AnchorSection
        macroTheme={panels.items[0].macroTheme}
        sectionTexts={pageHeaders.items[0]}
      /> */}
    </HubTemplate>
  );
}
