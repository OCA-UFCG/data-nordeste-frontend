import ArcGisContainer from "@/components/ArcGisContainer/ArcGisContainer";
import HubTemplate from "@/templates/HubTemplate";
import { notFound } from "next/navigation";

const isValidStoryId = (value: string) => /^[0-9a-f]{32}$/i.test(value);

export default function DataStory({ params }: { params: { id: string } }) {
  if (!isValidStoryId(params.id)) return notFound();

  return (
    <HubTemplate>
      <ArcGisContainer
        source={`https://storymaps.arcgis.com/stories/${params.id}`}
      />
    </HubTemplate>
  );
}
