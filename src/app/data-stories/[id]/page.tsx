import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";

// DO NOT CHANGE: reject non-hex StoryMap IDs before embedding ArcGIS content.
const isValidStoryId = (value: string) => /^[0-9a-f]{32}$/i.test(value);

export default async function DataStory({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidStoryId(id)) return notFound();

  return (
    <HubTemplate>
      <ArcGisContainer source={`https://storymaps.arcgis.com/stories/${id}`} />
    </HubTemplate>
  );
}
