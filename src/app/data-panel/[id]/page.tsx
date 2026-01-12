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

export default async function DataPanel({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pageName?: string };
}) {
  const {
    panelsCollection: panels,

    // pageHeadersCollection: pageHeaders,
  }: IDataPanelContent = await getContent(DATA_PANEL_QUERY, { id: params.id });

  if (!panels.items.length) {
    notFound();
  }

  return (
    <HubTemplate>
      <div className="flex justify-center h-full w-full items-center overflow-hidden">
        <PowerBIContainer
          panel={panels.items[0]}
          pageName={searchParams.pageName}
        />
      </div>
      {/* <AnchorSection
        macroTheme={panels.items[0].macroTheme}
        sectionTexts={pageHeaders.items[0]}
      /> */}
    </HubTemplate>
  );
}
