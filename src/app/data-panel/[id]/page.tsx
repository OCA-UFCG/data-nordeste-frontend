import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function DataPanel({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { pageName?: string };
}) {
  const { panels } = await getContent(["panels"]);
  const selectedPanel = panels.find(
    (panel: any) => panel.fields.title === params.id,
  );

  if (!selectedPanel) {
    notFound();
  }

  return (
    <HubTemplate>
      <div className="flex justify-center h-full w-full items-center overflow-hidden">
        <PowerBIContainer
          panel={selectedPanel}
          pageName={searchParams.pageName}
        />
      </div>
    </HubTemplate>
  );
}
