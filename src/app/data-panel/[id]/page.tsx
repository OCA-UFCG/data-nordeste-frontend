import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { Container } from "./styles";
import { notFound } from "next/navigation";

export default async function DataPanel({
  params,
}: {
  params: { id: string };
}) {
  const { panels } = await getContent(["panels"]);
  const selectedPanel = panels.find(
    (panel: any) => panel.fields.reportId === params.id,
  );

  if (!selectedPanel) {
    notFound();
  }

  return (
    <HubTemplate>
      <Container>
        <PowerBIContainer panel={selectedPanel} />
      </Container>
    </HubTemplate>
  );
}
