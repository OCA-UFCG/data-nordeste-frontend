import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";

const isValidExperienceId = (value: string) => /^[0-9a-f]{32}$/i.test(value);

export default async function Experience({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidExperienceId(id)) return notFound();

  return (
    <HubTemplate>
      <ArcGisContainer
        source={`https://experience.arcgis.com/experience/${id}`}
      />
    </HubTemplate>
  );
}
