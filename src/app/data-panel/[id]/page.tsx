import PowerBIContainer from "@/components/PowerBIContainer/PowerBiContainer";
import HubTemplate from "@/templates/HubTemplate";
import { getContent } from "@/utils/functions";
import { Container } from "./styles";
import { notFound } from "next/navigation";

export default async function DataPanel({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { panels } = await getContent(["panels"]);
  const selectedPanel = panels.find((panel: any) =>
    searchParams.page
      ? panel.fields.id === `${params.id}?page=${searchParams.page}`
      : panel.fields.id === params.id,
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
