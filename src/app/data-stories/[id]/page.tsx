import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";
import { buildStoryMapSource, isValidArcGisId } from "@/features/embeds/arcgis";

export default async function DataStory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // DO NOT CHANGE: reject non-hex StoryMap IDs before embedding ArcGIS content.
  if (!isValidArcGisId(id)) return notFound();

  return (
    <HubTemplate>
      <ArcGisContainer source={buildStoryMapSource(id)} />
    </HubTemplate>
  );
}
