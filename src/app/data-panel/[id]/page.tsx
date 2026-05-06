// import AnchorSection from "@/components/AnchorSection/AnchorSection";
import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/contentful";
import { IPageHeader, ReportData } from "@/utils/interfaces";
import { DATA_PANEL_QUERY } from "@/utils/queries";
import { notFound } from "next/navigation";

interface IDataPanelContent {
  panelsCollection: { items: ReportData[] };
  pageHeadersCollection: { items: IPageHeader[] };
}

export default async function DataPanel({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pageName?: string }>;
}) {
  const [{ id }, { pageName }] = await Promise.all([params, searchParams]);

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
        <PowerBIContainer panel={panels.items[0]} pageName={pageName} />
      </div>
      {/* <AnchorSection
        macroTheme={panels.items[0].macroTheme}
        sectionTexts={pageHeaders.items[0]}
      /> */}
    </HubTemplate>
  );
}
